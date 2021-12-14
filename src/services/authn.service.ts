import store from "@/store";

export function cityPyOUserid(): string {
  return store.state?.cityPyO?.userid ?? undefined;
}
