import { MapboxMap } from "@/models";
import * as service from "@/services/map.service";

test("showLayers ", () => {
  const mock = {
    setLayoutProperty: jest.fn(),
    getLayer: () => true,
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
    getLayer: () => true,
  } as unknown as MapboxMap;
  service.hideLayers(mock, ["test"]);
  expect(mock.setLayoutProperty).toHaveBeenCalledWith(
    "test",
    "visibility",
    "none"
  );
});

test("getUserContentLayers with not fully loaded map", () => {
  const mock = {
    loaded: () => false,
  } as unknown as MapboxMap;
  const result = service.getUserContentLayers(mock);
  expect(result).toHaveLength(0);
});

test("getUserContentLayers without user-content layers", () => {
  const mock = {
    loaded: () => true,
    style: {
      _layers: [
        {
          metadata: "something",
        },
        {
          metadata: undefined,
        },
      ],
    },
  } as unknown as MapboxMap;
  const result = service.getUserContentLayers(mock);
  expect(result).toHaveLength(0);
});

test("getUserContentLayers with user-content layers", () => {
  const mock = {
    loaded: () => true,
    style: {
      _layers: [
        {
          metadata: "something",
        },
        {
          metadata: undefined,
        },
        {
          metadata: "user-content",
          id: "test",
        },
      ],
    },
  } as unknown as MapboxMap;
  const result = service.getUserContentLayers(mock);
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe("test");
});

test("getUserContentLayerIds with user-content layers", () => {
  const mock = {
    loaded: () => true,
    style: {
      _layers: [
        {
          metadata: "something",
        },
        {
          metadata: undefined,
        },
        {
          metadata: "user-content",
          id: "test",
        },
      ],
    },
  } as unknown as MapboxMap;
  const result = service.getUserContentLayerIds(mock);
  expect(result).toHaveLength(1);
  expect(result[0]).toBe("test");
});

test("getUserContentLayerIds without user-content layers", () => {
  const mock = {
    loaded: () => true,
    style: {
      layers: [
        {
          metadata: "something",
        },
        {
          metadata: undefined,
        },
      ],
    },
  } as unknown as MapboxMap;
  const result = service.getUserContentLayerIds(mock);
  expect(result).toHaveLength(0);
});
