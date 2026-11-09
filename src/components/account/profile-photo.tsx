import { useRef } from "react";

import { useMutation } from "@tanstack/react-query";

import { UploadIcon, XIcon } from "lucide-react";

import { SettingsRow } from "@/components/shared/settings-row";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { removeAvatarMutationOptions } from "@/data/auth/remove-avatar";
import { useRefreshSession } from "@/data/auth/session-refresh";
import { updateUserMutationOptions } from "@/data/auth/update-user";
import { uploadAvatarMutationOptions } from "@/data/auth/upload-avatar";
import { AVATAR_TYPES } from "@/lib/avatar";
import { getInitials } from "@/lib/initials";

type ProfilePhotoProps = {
  user: { name: string; image?: string | null };
};

export function ProfilePhoto({ user }: ProfilePhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const refreshSession = useRefreshSession();

  const updateUser = useMutation(updateUserMutationOptions);

  const uploadAvatar = useMutation({
    ...uploadAvatarMutationOptions,
    onSuccess: async ({ url }) => {
      await updateUser.mutateAsync({ image: url });
      await refreshSession();
    },
  });

  const removeAvatar = useMutation({
    ...removeAvatarMutationOptions,
    onSuccess: async () => {
      await updateUser.mutateAsync({ image: null });
      await refreshSession();
    },
  });

  const error = uploadAvatar.error ?? removeAvatar.error ?? updateUser.error;
  const busy = uploadAvatar.isPending || removeAvatar.isPending || updateUser.isPending;

  return (
    <SettingsRow title="Profile Photo" description="Shown in the header and across your workspace.">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback>{getInitials(user.name) || "U"}</AvatarFallback>
        </Avatar>
        <input
          ref={inputRef}
          type="file"
          accept={Object.keys(AVATAR_TYPES).join(",")}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadAvatar.mutate(file);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={uploadAvatar.isPending}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon />
          Change
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={removeAvatar.isPending}
          disabled={busy || !user.image}
          onClick={() => removeAvatar.mutate()}
        >
          <XIcon />
          Remove
        </Button>
      </div>
      {error && <p className="text-destructive-foreground text-xs">{error.message}</p>}
    </SettingsRow>
  );
}
