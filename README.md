# GRASBROOK FUNCTIONAL SCOPE

![abm](https://user-images.githubusercontent.com/4631906/116558839-258ca300-a900-11eb-943f-dc9d65d0235d.gif)


## Features
The Grasbrook Functional Scope provides a mapbox based application to support functional planning for a new urban neighborhood. Users will be able to simulate pedestrian flows, stormwater runoffs, traffic noise propagation, sun exposure and wind speeds. With more modules to come.

### Pedestrian Flow Analysis
![abm](https://user-images.githubusercontent.com/4631906/116558881-30473800-a900-11eb-9157-2f65203ba3d3.gif)


### Noise Propagation Analysis
![noise](https://user-images.githubusercontent.com/4631906/116558911-350bec00-a900-11eb-9601-555e4b4ea138.gif)


### Multi Layer Analysis
Explore interrelationships of different result layers.
Example: In which areas are many pedestrians exposed to high traffic noise?
![multi_layer](https://user-images.githubusercontent.com/4631906/116558943-3a693680-a900-11eb-8eba-5cd2b0391cac.gif)



### Stormwater RunOff Analysis
Video to be uploaded

### Wind speed and Sun-Exposure Analysis
Video to be uploaded



## Project setup
Clone the project from github

### RUN in development mode
Create a local file containing you CityPyo login credentials in src/config/cityPyoDefaultUser.json
```javascript
{
  "username": "YourUserName", "password": "YourPassword"
}
```
Run CityPyO locally on port 5000
Or update the .env.development file to connect to nc.hcu-hamburg.de/cityPyo

Install dependencies
```
npm install
```
Serve front-end locally
```
npm start
```
View the app in a browser at localhost:8080

### RUN in production mode
Create a local file containing you CityPyo login credentials in src/config/cityPyoDefaultUser.json
This file can be an empty JSON e.g. {}

build source
```
npm i && npm run build
```


## Detail Info
### Files needed
#### Buildings
The buildings displayed on the map are stacked extrusions of 3 geojson layers. 
Please provide a groundfloor.json, upperfloor.json and rooftop.json via your CityPyo user.

Following properties can provided per Feature. 
Mandatory for the visualization to work are city_scope_id and land_use_detailed_type.
Upperfloor features must contain a float value for building_height
Rooftop features must contain float values for building_height and additional_roof_height

```javascript
{"building_id": "G03", "land_use_detailed_type": "residential", "building_height": 44.3, "additional_roof_height": 47.5, "area_planning_type": "building", "floor_area": 341.8590000002878, "city_scope_id": "B-03-1"}
```

#### OpenSpaces
The open spaces displayed are read from a spaces.json provided by your CityPyo user.
Following properties can provided per Feature. 
Mandatory for the visualization to work are city_scope_id and land_use_detailed_type.
```javascript
"properties": {"area_planning_type": "specialUseArea", "land_use_general_type": "privateOS", "land_use_detailed_type": "schoolOutdoorArea", "floor_area": 2774.420039495546, "city_scope_id": "S-283"}
```

#### Static results
Provide result files for the ABM results and Noise results (currently static).
Please ask maintainers for example files.


