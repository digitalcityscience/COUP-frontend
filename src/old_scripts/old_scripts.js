//CALCULATE TIME DATA (Andre) - DEPRECATED

calculateTimeData(data, intervalLength, targetArray){
    /*Add up total active agents per interval*/
    // iterate over each agent's timestamps first and log the intervals during which the agent is active
    data.forEach((agent,i,a) => {
        let transportMode = agent["agent"]["mode"]
        let age = agent["agent"]["agent_age"]
        let resvis = agent["agent"]["resident_or_visitor"]
        let activeIntervals = []
        agent.timestamps.forEach((timeStampValue,i,a) => {
        // iterate over all timestamps and find intervals during which the agent is active
        let matchingInterval = Math.floor( timeStampValue / intervalLength) * intervalLength
        if (!activeIntervals.includes(matchingInterval)) {
            // if the agent's activity in this interval wasn't logged yet
            // increment the busy agents count for this interval
            activeIntervals.push(matchingInterval)
            this.busyAgentsPerInterval[matchingInterval][age] += 1
            this.busyAgentsPerInterval[matchingInterval][resvis] += 1
            this.busyAgentsPerInterval[matchingInterval][transportMode] += 1
            this.busyAgentsPerInterval[matchingInterval]["total"] += 1
        }
        });
    });

    for (const [key, value] of Object.entries(this.busyAgentsPerInterval)) {
        targetArray.push(`${value['total']}`)
    }

    this.renderTimeGraph();
};

//GET DATA FOR TIME CHART (Andre) - DEPRECATED

getDataForTimeChart(){
    this.minTime = 8 // time chart start time
    this.maxTime = 24 // time chart end time
    //this.maxTime = 99999;
    const intervalLength = 5 * 60; // interval length in seconds; max interval length = 1h for labels to work
    const simulationLength = (this.maxTime - this.minTime) * 60 * 60;  // max time in seconds / intervalLength

    let intervals = [];
    this.intervalLabels = [];
    this.busyAgentsPerInterval = {};
    //this.timeCoords = [];

    /* create time intervals and their labels on x-axis */
    const intervalCount = Math.round(simulationLength  / intervalLength)
    for (let intervalIndex = 0; intervalIndex <= intervalCount; intervalIndex++) {
      const interval = intervalIndex * intervalLength
      this.intervalNes = intervalLength;
      const intervalLabel = Math.floor((interval / 3600) + 8) + ":00" // labels for full hours
      intervals.push(interval)
      this.intervalLabels.push(intervalLabel)
    }

    // initialize busy agents per interval with 0
    const emptyInterval = {}
    for (let mode of [...Object.values(this.filterOptions), 'resident', 'visitor', '0-6', '7-17', '18-35', '36-60', '61-100', 'total']) {
      emptyInterval[mode] = 0
    }
    for (let interval of intervals) {
      this.busyAgentsPerInterval[`${interval}`] = JSON.parse(JSON.stringify(emptyInterval));
    }
    
    if(this.activeAbmSet != null && this.activeAbmSet != 'undefined') {
      this.activeAbmTimeCoords = [];
      this.calculateTimeData(this.activeAbmSet, this.intervalNes, this.activeAbmTimeCoords);
    } else {
      this.timeCoords = [];
      this.calculateTimeData(this.abmData, this.intervalNes, this.timeCoords);
    }
  };

  //OLD ACTION.TS SCRIPTS
  /*update DECK LAYERs*/

  updateDeckLayer({state, commit, dispatch, rootState}, workshopScenario) {
    // show loading screen
    commit('resultLoading', true)

    let scenarioName = workshopScenario || abmTripsLayerName

    // load new data from cityPyo
    rootState.cityPyO.getAbmResultLayer(scenarioName, state).then(
      result => {
        // remove old trips layer from map
        if (!result) {
          if (rootState.map?.getLayer(abmTripsLayerName)) {
            rootState.map?.removeLayer(abmTripsLayerName)
          }
          // finally remove loading screen
          commit('resultLoading', false)
          return
        }

        buildTripsLayer(result.options.data, state.currentTimeStamp).then(
          deckLayer => {
            if (rootState.map?.getLayer(abmTripsLayerName)) {
              rootState.map?.removeLayer(abmTripsLayerName)
            }

            // check if scenario is still valid - user input might have changed while loading trips layer
            rootState.map?.addLayer(deckLayer)
            rootState.map?.moveLayer(abmTripsLayerName, "groundfloor")  // add layer on top of the groundfloor layer
            commit('addLayerId', abmTripsLayerName, {root: true})

            const heatMap = state.heatMap;
            commit('abmData', deckLayer?.props?.data)
            dispatch('preclusteringAbm', deckLayer?.props?.data)
            // finally remove loading screen
            commit('resultLoading', false)

            const abmData = state.abmData;
            const activeAbmSet = state.activeAbmSet;

            //if (!heatMap) {
              commit('animationRunning', true);
              animate(deckLayer, null, null, state.currentTimeStamp)
            //}
          }
        )
      }
    )
    return
  },
  rebuildTripsLayer({state, commit, dispatch, rootState}){
    const activeAbmSet = state.activeAbmSet;
    if(activeAbmSet != null && activeAbmSet != 'undefined'){
      var abmData = activeAbmSet;
    } else {
      var abmData = state.abmData;
    }

    buildTripsLayer(abmData, state.currentTimeStamp).then(
      deckLayer => {

        if(rootState.map?.getLayer(abmTripsLayerName)) {
          rootState.map?.removeLayer(abmTripsLayerName)
        }

        rootState.map?.addLayer(deckLayer)
        rootState.map?.moveLayer(abmTripsLayerName, "groundfloor")  // add layer on top of the groundfloor layer
        commit('addLayerId', abmTripsLayerName, {root: true});

        commit('animationRunning', true);
        animate(deckLayer, null, null, state.currentTimeStamp);
      });
  },
  rebuildDeckLayer({state, commit, dispatch, rootState}){ /*recalculate DeckLayer if HeatMap or TripsLayer is somehow changed*/
    //const abmData = state.abmData;
    const activeAbmSet = state.activeAbmSet;

    if(activeAbmSet != null && activeAbmSet != 'undefined'){
      var abmData = activeAbmSet;
    } else {
      var abmData = state.abmData;
    }

    /*Passing different setting for absolute (not average) and relative aggLayer data*/
    const settings = (state.heatMapType == 'average') ? [4, 0.03, 50, 0.5] : [26, 0.01, 80, 0.5];
    const heatMapTypeData = (state.heatMapType == 'average') ? state.heatMapAverage : state.heatMapData;
    console.log("try to rebuild active deck layers");

    buildTripsLayer(abmData, state.currentTimeStamp).then(
      deckLayer => {
        /*Do not remove Aggregation Layer on Building Trips Layer anymore
        if (rootState.map?.getLayer(abmAggregationLayerName)) {
          rootState.map?.removeLayer(abmAggregationLayerName)
          commit('removeLayerId', abmAggregationLayerName, {root: true})
        }*/

        if(rootState.map?.getLayer(abmTripsLayerName)) {
          rootState.map?.removeLayer(abmTripsLayerName)
        }

        rootState.map?.addLayer(deckLayer)
        rootState.map?.moveLayer(abmTripsLayerName, "groundfloor")  // add layer on top of the groundfloor layer
        commit('addLayerId', abmTripsLayerName, {root: true});

        commit('animationRunning', true);
        animate(deckLayer, null, null, state.currentTimeStamp);
      });

      if(state.heatMap){
        /*building Deck.gl Heatmap in deck-layers.ts*/
        buildAggregationLayer(heatMapTypeData, settings).then(
          deckLayer => {
            if (rootState.map?.getLayer(abmAggregationLayerName)) {
              rootState.map?.removeLayer(abmAggregationLayerName)
            }
  
            /*if(rootState.map?.getLayer(abmTripsLayerName)) {
              rootState.map?.removeLayer(abmTripsLayerName);
              commit('removeLayerId', abmTripsLayerName, {root: true})
            }*/
  
            console.log("new aggregation layer loaded");
            rootState.map?.addLayer(deckLayer)
            commit('addLayerId', abmAggregationLayerName, {root: true})
            if (rootState.map?.getLayer("groundfloor")) {
              rootState.map?.moveLayer("abmHeat", "groundfloor")
            }
  
          });
      } 
  },