import mockData from "./coda-mock-data.json";
import type { CodaMockData } from "@/src/types/domain";

type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends null
        ? null
        : T extends readonly (infer Item)[]
          ? Widen<Item>[]
          : T extends object
            ? { [Key in keyof T]: Widen<T[Key]> }
            : T;

// Check the fixture's structure while accounting for JSON's widened string values.
const structurallyCheckedMockData: Widen<CodaMockData> = mockData;
export const codaMockData = structurallyCheckedMockData as CodaMockData;
export default codaMockData;
