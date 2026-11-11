import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  type Announcements,
  type CollisionDetection,
  closestCenter,
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  type DndContextProps,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  KeyboardSensor,
  type Modifiers,
  MouseSensor,
  type ScreenReaderInstructions,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  type SortingStrategy,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

type Orientation = "vertical" | "horizontal" | "mixed";

const orientationConfig: Record<
  Orientation,
  {
    modifiers: Modifiers;
    strategy: SortingStrategy | undefined;
    collisionDetection: CollisionDetection;
  }
> = {
  vertical: {
    modifiers: [restrictToVerticalAxis, restrictToParentElement],
    strategy: verticalListSortingStrategy,
    collisionDetection: closestCenter,
  },
  horizontal: {
    modifiers: [restrictToHorizontalAxis, restrictToParentElement],
    strategy: horizontalListSortingStrategy,
    collisionDetection: closestCenter,
  },
  mixed: {
    modifiers: [restrictToParentElement],
    strategy: undefined,
    collisionDetection: closestCorners,
  },
};

const MOUSE_SENSOR = { activationConstraint: { distance: 4 } };
const TOUCH_SENSOR = { activationConstraint: { delay: 250, tolerance: 5 } };
const KEYBOARD_SENSOR = { coordinateGetter: sortableKeyboardCoordinates };

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }),
};

const subscribeToNothing = () => () => {};
const getIsMounted = () => true;
const getIsMountedOnServer = () => false;

type SortableRootContextValue = {
  items: UniqueIdentifier[];
  modifiers: DndContextProps["modifiers"];
  strategy: SortingStrategy | undefined;
  activeId: UniqueIdentifier | null;
};

const SortableRootContext = createContext<SortableRootContextValue | null>(null);

function useSortableRoot(consumer: string) {
  const context = useContext(SortableRootContext);
  if (!context) throw new Error(`\`${consumer}\` must be used within \`Sortable\``);
  return context;
}

export type SortableMoveEvent = DragEndEvent & { activeIndex: number; overIndex: number };

export type SortableProps<T> = Omit<
  DndContextProps,
  "onDragStart" | "onDragEnd" | "onDragCancel" | "children"
> & {
  value: T[];
  onValueChange?: (value: T[]) => void;
  getItemValue: (item: T) => UniqueIdentifier;
  getItemLabel?: (id: UniqueIdentifier) => string;
  onMove?: (event: SortableMoveEvent) => void;
  onValueCommit?: (value: T[], event: SortableMoveEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragCancel?: (event: DragEndEvent) => void;
  orientation?: Orientation;
  children: ReactNode;
};

export function Sortable<T>({
  value,
  onValueChange,
  getItemValue,
  getItemLabel,
  onMove,
  onValueCommit,
  onDragStart: onDragStartProp,
  onDragEnd: onDragEndProp,
  onDragCancel: onDragCancelProp,
  orientation = "vertical",
  modifiers,
  collisionDetection,
  accessibility,
  children,
  ...props
}: SortableProps<T>) {
  const id = useId();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const config = orientationConfig[orientation];

  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE_SENSOR),
    useSensor(TouchSensor, TOUCH_SENSOR),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR),
  );

  const items = useMemo(() => value.map(getItemValue), [value, getItemValue]);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      onDragStartProp?.(event);
      setActiveId(event.active.id);
    },
    [onDragStartProp],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      onDragEndProp?.(event);
      setActiveId(null);

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeIndex = items.indexOf(active.id);
      const overIndex = items.indexOf(over.id);
      if (activeIndex === -1 || overIndex === -1) return;

      const move = { ...event, activeIndex, overIndex };
      if (onMove) onMove(move);
      else {
        const next = arrayMove(value, activeIndex, overIndex);
        onValueChange?.(next);
        onValueCommit?.(next, move);
      }
    },
    [items, value, onMove, onValueChange, onValueCommit, onDragEndProp],
  );

  const onDragCancel = useCallback(
    (event: DragEndEvent) => {
      onDragCancelProp?.(event);
      setActiveId(null);
    },
    [onDragCancelProp],
  );

  const announcements: Announcements = useMemo(() => {
    const label = (itemId: UniqueIdentifier) => getItemLabel?.(itemId) ?? String(itemId);
    const position = (index: number | undefined) => `${(index ?? 0) + 1} of ${value.length}`;
    return {
      onDragStart: ({ active }) =>
        `Picked up "${label(active.id)}". Position ${position(active.data.current?.sortable.index)}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `"${label(active.id)}" moved to position ${position(over.data.current?.sortable.index)}.`
          : `"${label(active.id)}" is no longer over a list.`,
      onDragEnd: ({ active, over }) =>
        over
          ? `"${label(active.id)}" dropped at position ${position(over.data.current?.sortable.index)}.`
          : `"${label(active.id)}" dropped. No changes were made.`,
      onDragCancel: ({ active }) =>
        `Sorting cancelled. "${label(active.id)}" returned to position ${position(active.data.current?.sortable.index)}.`,
    };
  }, [value.length, getItemLabel]);

  const screenReaderInstructions: ScreenReaderInstructions = useMemo(
    () => ({
      draggable: `To reorder, press space or enter on the handle, then use the ${
        orientation === "vertical"
          ? "up and down"
          : orientation === "horizontal"
            ? "left and right"
            : "arrow"
      } keys. Press space or enter again to drop, or escape to cancel.`,
    }),
    [orientation],
  );

  const context = useMemo<SortableRootContextValue>(
    () => ({
      items,
      modifiers: modifiers ?? config.modifiers,
      strategy: config.strategy,
      activeId,
    }),
    [items, modifiers, config, activeId],
  );

  return (
    <SortableRootContext.Provider value={context}>
      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={collisionDetection ?? config.collisionDetection}
        modifiers={modifiers ?? config.modifiers}
        {...props}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{ announcements, screenReaderInstructions, ...accessibility }}
      >
        {children}
      </DndContext>
    </SortableRootContext.Provider>
  );
}

export function SortableContent({ className, render, ...props }: useRender.ComponentProps<"div">) {
  const { items, strategy, activeId } = useSortableRoot("SortableContent");

  return (
    <SortableContext items={items} strategy={strategy}>
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(
          {
            "data-slot": "sortable-content",
            "data-dragging": activeId !== null ? "" : undefined,
            className: cn(activeId !== null && "cursor-grabbing", className),
          } as ComponentProps<"div">,
          props,
        ),
      })}
    </SortableContext>
  );
}

type SortableItemContextValue = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  isDragging: boolean;
  disabled: boolean;
};

const SortableItemContext = createContext<SortableItemContextValue | null>(null);
const SortableOverlayContext = createContext(false);

export function SortableItem({
  value,
  disabled = false,
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & { value: UniqueIdentifier; disabled?: boolean }) {
  const inOverlay = useContext(SortableOverlayContext);
  const {
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging,
  } = useSortable({ id: value, disabled: disabled || inOverlay, animateLayoutChanges });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const context = useMemo<SortableItemContextValue>(
    () => ({ attributes, listeners, setActivatorNodeRef, isDragging, disabled }),
    [attributes, listeners, setActivatorNodeRef, isDragging, disabled],
  );

  const element = useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        "data-slot": "sortable-item",
        "data-dragging": isDragging || inOverlay ? "" : undefined,
        "data-disabled": disabled ? "" : undefined,
        ref: inOverlay ? undefined : setNodeRef,
        style: inOverlay ? undefined : style,
        className: cn(isDragging && "relative z-10", className),
      } as ComponentProps<"div">,
      props,
    ),
  });

  return <SortableItemContext.Provider value={context}>{element}</SortableItemContext.Provider>;
}

export function SortableItemHandle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button">) {
  const context = useContext(SortableItemContext);
  if (!context) throw new Error("`SortableItemHandle` must be used within `SortableItem`");
  const { attributes, listeners, setActivatorNodeRef, isDragging, disabled } = context;

  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      {
        type: "button",
        "data-slot": "sortable-item-handle",
        "data-dragging": isDragging ? "" : undefined,
        disabled,
        ref: setActivatorNodeRef,
        ...attributes,
        ...listeners,
        className: cn(
          "touch-none",
          !disabled && (isDragging ? "cursor-grabbing" : "cursor-grab"),
          className,
        ),
      } as ComponentProps<"button">,
      props,
    ),
  });
}

export function SortableOverlay({
  children,
  className,
}: {
  children: ReactNode | ((params: { value: UniqueIdentifier }) => ReactNode);
  className?: string;
}) {
  const { modifiers, activeId } = useSortableRoot("SortableOverlay");
  const mounted = useSyncExternalStore(subscribeToNothing, getIsMounted, getIsMountedOnServer);
  if (!mounted) return null;

  const content =
    activeId === null
      ? null
      : typeof children === "function"
        ? children({ value: activeId })
        : children;

  return createPortal(
    <DragOverlay
      dropAnimation={dropAnimation}
      modifiers={modifiers}
      className={cn("z-50 cursor-grabbing", className)}
    >
      <SortableOverlayContext.Provider value>{content}</SortableOverlayContext.Provider>
    </DragOverlay>,
    document.body,
  );
}
