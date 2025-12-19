import { SUIT, VNUMBER } from "../../../shared/GameConstants.js";

// Rules for describing hands
//  - Components must be in the exact order shown on the NMJL card
//  - This order is used for display in the hint panel

export const handsLikeNumbers = {
  groupDescription: "Like numbers",
  hands: [
    {
      description: "FF 1111 DDDD 1111 (any 3 suits)",
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
          count: 4,
        },
        {
          suit: SUIT.VSUIT2_DRAGON,
          number: 0,
          count: 4,
        },
        {
          suit: SUIT.VSUIT3,
          number: VNUMBER.CONSECUTIVE1,
          count: 4,
        },
      ],
    },
    {
      description: "FFF 1111 FFF 1111 (any 2 suits)",
      vsuitCount: 2,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.FLOWER,
          number: 0,
          count: 3,
        },
        {
          suit: SUIT.FLOWER,
          number: 0,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE1,
          count: 4,
        },
      ],
    },
  ],
};
