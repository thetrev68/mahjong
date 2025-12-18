import { SUIT, WIND, VNUMBER } from "../../../constants.js";

// Rules for describing hands
//  - Components must be in the exact order shown on the NMJL card
//  - This order is used for display in the hint panel

export const handsQuints = {
  groupDescription: "Quints",
  hands: [
    {
      description: "FF 111 2222 33333 (Any 3 Suits, Any 3 Consec. Nos)",
      vsuitCount: 3,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.FLOWER,
          number: 0,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 3,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE2,
          count: 4,
        },
        {
          suit: SUIT.VSUIT3,
          number: VNUMBER.CONSECUTIVE3,
          count: 5,
        },
      ],
    },
    {
      description: "11 111 NNNN 22222 (Any 1 Suit, Any Consec. Nos, Any Wind)",
      vsuitCount: 1,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 3,
        },
        {
          suit: SUIT.WIND,
          number: WIND.NORTH,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE2,
          count: 5,
        },
      ],
    },
    {
      description: "FF 11111 11 11111 (Any 3 Suits, Any Like Nos)",
      vsuitCount: 3,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.FLOWER,
          number: 0,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 5,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE1,
          count: 2,
        },
        {
          suit: SUIT.VSUIT3,
          number: VNUMBER.CONSECUTIVE1,
          count: 5,
        },
      ],
    },
  ],
};
