export function cityPyOUserid(cityPyO: { userid: string }): string | undefined {
  return cityPyO?.userid ?? undefined;
}
