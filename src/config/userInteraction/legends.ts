export default {
  buildingUses: {
    headline: "Building Use Types",
    icon: "mdi-city",
    categories: [
      {
        label: "Residential",
        color: "#FFB121",
      },
      {
        label: "Commercial | Office",
        color: "#F76A6A",
      },
      {
        label: "Public | Daycare",
        color: "#4EBFFC",
      },
    ],
  },
  wind: {
    headline: "Lawson Criteria categories",
    icon: "mdi-windsock",
    labelLowValues: "Comfortable",
    labelHighValues: "Uncomfortable",
    categories: [
      {
        label: "Sitting Long",
        detail: "0.0 - 2.5m/s",
        color: "#458cbf",
      },
      {
        label: "Sitting Short",
        detail: "2.5 - 4.0m/s",
        color: "#95d3e0",
      },
      {
        label: "Walking Slow",
        detail: "4.0 - 6.0m/s",
        color: "#90c363",
      },
      {
        label: "Walking Fast",
        detail: "6.0 - 8.0 m/s",
        color: "#f4ec7d",
      },
      {
        label: "Uncomfortable",
        detail: "8.0 - 10.0 m/s",
        color: "#fbc46f",
      },
      {
        label: "Dangerous",
        detail: ">10.0m/s",
        color: "#ee7679",
      },
    ],
  },
  sunExposure: {
    headline: "Hours of sunlight per day averaged over a year",
    icon: "mdi-circle",
    labelLowValues: "Shady",
    labelHighValues: "Sunny",
    categories: [
      {
        label: "< 1.2 h/day",
        color: "#0571b0",
      },
      {
        label: "1.2 h/day",
        color: "#6aaed1",
      },
      {
        label: "2.4 h/day",
        color: "#b2d5e6",
      },
      {
        label: "3.6 h/day",
        color: "#e7eff3",
      },
      {
        label: "4.8 h/day",
        color: "#f7ece7",
      },
      {
        label: "6 h/day",
        color: "#f6dbcf",
      },
      {
        label: "7.2 h/day",
        color: "#f6cbb7",
      },
      {
        label: "8.4 h/day",
        color: "#f5baa0",
      },
      {
        label: "9.6 h/day",
        color: "#f5a988",
      },
      {
        label: "10.8 h/day",
        color: "#e97867",
      },
      {
        label: "12 h/day",
        color: "#da3c43",
      },
    ],
  },
  noise: {
    headline: "Noise Results in dB [LDEN]",
    labelLowValues: "Quiet",
    labelHighValues: "Noisy",
    icon: "mdi-bullhorn",
    categories: [
      {
        label: "<45dB (A)",
        color: "#B8D6D1",
      },
      {
        label: "45-50dB (A)",
        color: "#CEE4CC",
      },
      {
        label: "50-55dB (A)",
        color: "#E2F2BF",
      },
      {
        label: "55-60dB (A)",
        color: "#F3C683",
        icon: "mdi-circle",
      },
      {
        label: "60-65dB (A)",
        color: "#E87E4D",
      },
      {
        label: "65-70dB (A)",
        color: "#CD463E",
      },
      {
        label: "70-75dB (A)",
        color: "#A11A4D",
      },
      {
        label: ">75dB (A)",
        color: "#75085C",
      },
    ],
  },
  stormwater: {
    headline: "Run Off Times",
    icon: "mdi-bullhorn",
    categories: [
      {
        label: "<45dB (A)",
        color: "#B8D6D1",
      },
      {
        label: "45-50dB (A)",
        color: "#CEE4CC",
      },
      {
        label: "50-55dB (A)",
        color: "#E2F2BF",
      },
      {
        label: "55-60dB (A)",
        color: "#F3C683",
        icon: "mdi-circle",
      },
      {
        label: "60-65dB (A)",
        color: "#E87E4D",
      },
      {
        label: "65-70dB (A)",
        color: "#CD463E",
      },
      {
        label: "70-75dB (A)",
        color: "#A11A4D",
      },
      {
        label: ">75dB (A)",
        color: "#75085C",
      },
    ],
  },
};
