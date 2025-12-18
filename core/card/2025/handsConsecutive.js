import { SUIT, VNUMBER } from "../../../constants.js";

// Rules for describing hands
//  - Components must be in the exact order shown on the NMJL card
//  - This order is used for display in the hint panel

export const handsConsecutive = {
  groupDescription: "Consecutive",
  hands: [
    {
      description: "11 222 3333 444 55 (Any 1 Suit, These Nos Only)",
      vsuitCount: 1,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 1,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: 2,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: 3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: 4,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: 5,
          count: 2,
        },
      ],
    },
    {
      description: "55 666 7777 888 99 (Any 1 Suit, These Nos Only)",
      vsuitCount: 1,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 5,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: 6,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: 7,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: 8,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: 9,
          count: 2,
        },
      ],
    },
    {
      description: "111 2222 333 4444 (Any 1 or 2 Suits, Any 4 Consec Nos)",
      vsuitCount: 1,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE2,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE3,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE4,
          count: 4,
        },
      ],
    },
    {
      description: "111 2222 333 4444 (Any 1 or 2 Suits, Any 4 Consec Nos)",
      vsuitCount: 2,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE2,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE3,
          count: 3,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE4,
          count: 4,
        },
      ],
    },
    {
      description: "FFFF 1111 22 3333 (Any 1 or 3 Suits, Any 3 Consec Nos)",
      vsuitCount: 1,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.FLOWER,
          number: 0,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE2,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE3,
          count: 4,
        },
      ],
    },
    {
      description: "FFFF 1111 22 3333 (Any 1 or 3 Suits, Any 3 Consec Nos)",
      vsuitCount: 3,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.FLOWER,
          number: 0,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE2,
          count: 2,
        },
        {
          suit: SUIT.VSUIT3,
          number: VNUMBER.CONSECUTIVE3,
          count: 4,
        },
      ],
    },
    {
      description: "FFF 123 4444 5555 (Any 3 Suits, Any 5 Consec Nos)",
      vsuitCount: 3,
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
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 1,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE2,
          count: 1,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE3,
          count: 1,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE4,
          count: 4,
        },
        {
          suit: SUIT.VSUIT3,
          number: VNUMBER.CONSECUTIVE5,
          count: 4,
        },
      ],
    },
    {
      description: "FF 11 222 3333 DDD (Any 1 Suite, Any 3 Consec Nos)",
      vsuitCount: 1,
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
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE2,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1_DRAGON,
          number: 0,
          count: 3,
        },
      ],
    },
    {
      description:
        "111 222 3333 DD DD (Any 3 Suits, Any 3 consec Nos v Opp Dragons)",
      vsuitCount: 3,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE1,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE2,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2_DRAGON,
          number: 0,
          count: 2,
        },
        {
          suit: SUIT.VSUIT3_DRAGON,
          number: 0,
          count: 2,
        },
      ],
    },
    {
      description:
        "112345 1111 1111 (Any 5 Consec Nos, Pair Any Nos In Run, Kongs Match Pair)",
      vsuitCount: 5,
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
          number: VNUMBER.CONSECUTIVE2,
          count: 1,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE3,
          count: 1,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE4,
          count: 1,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE5,
          count: 1,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE1,
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
      description: "FF 1 22 333 1 22 333 (Any 2 Suits, Any Same 3 Consec Nos)",
      vsuitCount: 2,
      concealed: true,
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
          count: 1,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE2,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: VNUMBER.CONSECUTIVE3,
          count: 3,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE1,
          count: 1,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE2,
          count: 2,
        },
        {
          suit: SUIT.VSUIT2,
          number: VNUMBER.CONSECUTIVE3,
          count: 3,
        },
      ],
    },
  ],
};
