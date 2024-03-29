import type {
  CityPyOUser,
  GeoJSON,
  AbmScenarioConfiguration,
  AbmResponse,
} from "@/models";

export default class CityPyO {
  url: string;
  userid: string;

  constructor() {
    this.url = process.env.VUE_APP_CITYPYO_URL;
    //this.login(userdata)
  }

  async login(userdata: {
    username: string;
    password: string;
  }): Promise<CityPyOUser> {
    // log login request on cityPyo only if in production
    userdata["log_this_request"] = !(process.env.NODE_ENV === "development");

    const res = await fetch(this.url + "login", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userdata),
    });

    if (res.status === 200) {
      const json = await res.json();
      this.userid = json.user_id;

      return {
        authenticated: true,
        restricted: json.restricted,
        context: json.context,
      };
    } else {
      console.warn(res.status, res.statusText);
      return { authenticated: false };
    }
  }

  async performRequest(requestUrl, body) {
    const res = await fetch(requestUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status !== 200) {
      console.warn(
        "could not get/update ressource from cityPyo ",
        requestUrl,
        res.status,
        res.statusText
      );
    }

    return await res;
  }

  async getLayer(id: string): Promise<GeoJSON> {
    console.log("getting layer id from cityPyo", id);

    const requestUrl = this.url + "getLayer";

    const body = {
      userid: this.userid,
      layer: id,
    };

    const response = await this.performRequest(requestUrl, body);

    if (response.status == 200) {
      const responseJson = await response.json();

      return await responseJson;
    }
  }

  /**
   * @param fileName | without the .json ending
   * @param propPath | path to property that should be updated (inside the file)
   * @param payload | new value of the property to be updated
   */
  async addLayerData(fileName: string, propPath: Array<string>, payload) {
    let requestUrl = this.url + "addLayerData/" + fileName;

    for (const prop of propPath) {
      requestUrl += "/" + prop;
    }

    const body = {
      userid: this.userid,
      data: payload,
    };
    await this.performRequest(requestUrl, body);
  }

  // TODO rename into get abmResultData
  async getAbmResultLayer(
    scenario: AbmScenarioConfiguration
  ): Promise<AbmResponse> {
    // fetch abm scenario based on module settings and view filters
    const requestUrl = this.url + "getLayer/" + "abmScenario";
    const body = {
      userid: this.userid,
      scenario_properties: scenario,
      agent_filters: {},
    };

    const response = await this.performRequest(requestUrl, body);
    if (response.status == 200) {
      const responseJson = await response.json();

      return {
        simulationResult: responseJson["simulationResult"],
        amenitiesGeoJSON: responseJson["amenitiesGeoJSON"],
      };
    }
  }

  async combineLayers(layer1, layer2) {
    const requestUrl = this.url + "combineLayers";

    const body = {
      userid: this.userid,
      layer_1: layer1,
      layer_2: layer2,
    };
    const response = await this.performRequest(requestUrl, body);

    if (response.status === 200) {
      const responseJson = await response.json();
      return await responseJson;
    } else {
      return null;
    }
  }
}
