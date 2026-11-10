import type { StandardSchemaV1 } from "@tanstack/react-form";

export const formSchema = <Values>(schema: StandardSchemaV1<any, any>) =>
  schema as StandardSchemaV1<Values, unknown>;
