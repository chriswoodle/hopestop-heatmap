/* global window */
import React, { Component } from 'react';
import { render } from 'react-dom';
import { StaticMap } from 'react-map-gl';
import { PhongMaterial } from '@luma.gl/core';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import DeckGL from '@deck.gl/react';
import Coordinates from 'coordinate-parser';

const MARTASubwayLocationsJasonConversions = require('./MARTASubwayLocationsJasonConversions.json');
const MajorShoppingCentersJSONConversion = require('./MajorShoppingCentersJSONConversion.json');
const FosterCareAdoptionAtlantaJSONConversion = require('./FosterCareAdoptionAtlantaJSONConversion.json');
const AtlantaPublicSchoolsJSONConversation = require('./AtlantaPublicSchoolsJSONConversation.json');
const LoopCityLimits = require('./285_Loop_City_Limits.json');
console.log(MARTASubwayLocationsJasonConversions);
// Set your mapbox token here
const MAPBOX_TOKEN = "pk.eyJ1IjoiY2hyaXN3b29kbGUiLCJhIjoiY2pkejZiMmhnMGtzajJ4cDlpczJ4cnRjdiJ9.3jx2hX-uqpjGuKaXPVWGRg"; // eslint-disable-line

// Source data CSV
const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/3d-heatmap/heatmap-data.csv'; // eslint-disable-line

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-0.144528, 49.739968, 80000]
});

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-3.807751, 54.104682, 8000]
});

const lightingEffect = new LightingEffect({ ambientLight, pointLight1, pointLight2 });

const material = new PhongMaterial({
  ambient: 0.64,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [51, 51, 51]
});

export const INITIAL_VIEW_STATE = {
  longitude: -84.386330,
  latitude: 33.753746,
  zoom: 9,
  minZoom: 5,
  maxZoom: 100,
  pitch: 40.5,
  bearing: 0
};

const colorRange = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78]
];

const elevationScale = { min: 1, max: 5 };

/* eslint-disable react/no-deprecated */
export class App extends Component {
  static get defaultColorRange() {
    return colorRange;
  }

  constructor(props) {
    super(props);
    this.state = {
      elevationScale: elevationScale.min
    };

    this.startAnimationTimer = null;
    this.intervalTimer = null;

    this._startAnimate = this._startAnimate.bind(this);
    this._animateHeight = this._animateHeight.bind(this);
  }

  componentDidMount() {
    this._animate();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data && this.props.data && nextProps.data.length !== this.props.data.length) {
      this._animate();
    }
  }

  componentWillUnmount() {
    this._stopAnimate();
  }

  _animate() {
    this._stopAnimate();

    // wait 1.5 secs to start animation so that all data are loaded
    this.startAnimationTimer = window.setTimeout(this._startAnimate, 1500);
  }

  _startAnimate() {
    this.intervalTimer = window.setInterval(this._animateHeight, 20);
  }

  _stopAnimate() {
    window.clearTimeout(this.startAnimationTimer);
    window.clearTimeout(this.intervalTimer);
  }

  _animateHeight() {
    if (this.state.elevationScale === elevationScale.max) {
      this._stopAnimate();
    } else {
      this.setState({ elevationScale: this.state.elevationScale + 1 });
    }
  }

  _renderLayers() {
    const { data, radius = 1000, upperPercentile = 99, coverage = 1 } = this.props;

    return [
      new HexagonLayer({
        id: 'heatmap',
        colorRange,
        coverage,
        data,
        elevationRange: [0, 3000],
        elevationScale: this.state.elevationScale,
        extruded: true,
        getPosition: d => d,
        onHover: info => setTooltip(info.object, info.x, info.y),
        opacity: 0.7,
        pickable: true,
        radius,
        upperPercentile,
        material
      })
    ];
  }

  render() {
    const { viewState, controller = true, baseMap = true } = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        effects={[lightingEffect]}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        controller={controller}
      >
        {baseMap && (
          <StaticMap
            reuseMaps
            mapStyle="mapbox://styles/mapbox/dark-v9"
            preventStyleDiffing={true}
            mapboxApiAccessToken={MAPBOX_TOKEN}
          />
        )}
      </DeckGL>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);

  const data = [
    ...getData(MARTASubwayLocationsJasonConversions),
    ...getData(MajorShoppingCentersJSONConversion),
    ...getData(FosterCareAdoptionAtlantaJSONConversion),
    ...AtlantaPublicSchoolsJSONConversation.features.map(feature => feature.geometry.coordinates),
    ...LoopCityLimits.features.map(feature => feature.geometry.coordinates)
  ]

  console.log(data);

  render(<App data={data} />, container);
}

function getData(geo) {
  return geo.features.map(feature => {
    try {
      const position = new Coordinates(`${feature.properties.latitude.replace(',', '.').replace(',', '')} ${feature.properties.longitude.replace(',', '.').replace(',', '')}`);
      const latitude = position.getLatitude();
      const longitude = position.getLongitude();
      console.log([longitude, latitude]);
      return [longitude, latitude]
    } catch (error) {
      console.log(feature);
      console.log(error)
      return [0, 0]
    }
  })
}

function setTooltip(object, x, y) {
  const el = document.getElementById('tooltip');
  console.log(x,y)
  if (object) {
    el.innerHTML = `${object.points.length} locations`;
    el.style.display = 'block';
    el.style.left = x - 50 + 'px';
    el.style.top = y - 40 + 'px';
  } else {
    el.style.display = 'none';
  }
}