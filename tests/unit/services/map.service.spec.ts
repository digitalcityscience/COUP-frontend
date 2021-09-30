import { MapboxMap } from "@/models";
import * as service from "@/services/map.service";

test("showLayers ", () => {
  const mock = {
    setLayoutProperty: jest.fn(),
  } as unknown as MapboxMap;
  service.showLayers(mock, ["test"]);
  expect(mock.setLayoutProperty).toHaveBeenCalledWith(
    "test",
    "visibility",
    "visible"
  );
});

test("hideLayers ", () => {
  const mock = {
    setLayoutProperty: jest.fn(),
  } as unknown as MapboxMap;
  service.hideLayers(mock, ["test"]);
  expect(mock.setLayoutProperty).toHaveBeenCalledWith(
    "test",
    "visibility",
    "none"
  );
});
