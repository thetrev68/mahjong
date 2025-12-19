import { SUIT } from "../../../shared/GameConstants.js";

// Rules for describing hands
//  - Components must be in the exact order shown on the NMJL card
//  - This order is used for display in the hint panel

export const hands369 = {
  groupDescription: "369",
  hands: [
    {
      description: "333 6666 666 9999 (Any 2 or 3 Suits)",
      vsuitCount: 2,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 3,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: 6,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2,
          number: 6,
          count: 3,
        },
        {
          suit: SUIT.VSUIT2,
          number: 9,
          count: 4,
        },
      ],
    },
    {
      description: "333 6666 666 9999 (Any 2 or 3 Suits)",
      vsuitCount: 3,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 3,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1,
          number: 6,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2,
          number: 6,
          count: 3,
        },
        {
          suit: SUIT.VSUIT3,
          number: 9,
          count: 4,
        },
      ],
    },
    {
      description: "FF 3333 + 6666 = 9999 (Any 1 or 3 Suits)",
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
          number: 3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: 6,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1,
          number: 9,
          count: 4,
        },
      ],
    },
    {
      description: "FF 3333 + 6666 = 9999 (Any 1 or 3 Suits)",
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
          number: 3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2,
          number: 6,
          count: 4,
        },
        {
          suit: SUIT.VSUIT3,
          number: 9,
          count: 4,
        },
      ],
    },
    {
      description:
        "3333 DDD 3333 DDD (Any 2 Suits, Like Kongs 3, 6, or 9 w Matching Dragons)",
      vsuitCount: 2,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1_DRAGON,
          number: 0,
          count: 3,
        },
        {
          suit: SUIT.VSUIT2,
          number: 3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2_DRAGON,
          number: 0,
          count: 3,
        },
      ],
    },
    {
      description:
        "3333 DDD 3333 DDD (Any 2 Suits, Like Kongs 3, 6, or 9 w Matching Dragons)",
      vsuitCount: 2,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 6,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1_DRAGON,
          number: 0,
          count: 3,
        },
        {
          suit: SUIT.VSUIT2,
          number: 6,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2_DRAGON,
          number: 0,
          count: 3,
        },
      ],
    },
    {
      description:
        "3333 DDD 3333 DDD (Any 2 Suits, Like Kongs 3, 6, or 9 w Matching Dragons)",
      vsuitCount: 2,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 9,
          count: 4,
        },
        {
          suit: SUIT.VSUIT1_DRAGON,
          number: 0,
          count: 3,
        },
        {
          suit: SUIT.VSUIT2,
          number: 9,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2_DRAGON,
          number: 0,
          count: 3,
        },
      ],
    },
    {
      description: "FFF 3333 369 9999 (Any 2 Suits)",
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
          suit: SUIT.VSUIT1,
          number: 3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT2,
          number: 3,
          count: 1,
        },
        {
          suit: SUIT.VSUIT2,
          number: 6,
          count: 1,
        },
        {
          suit: SUIT.VSUIT2,
          number: 9,
          count: 1,
        },
        {
          suit: SUIT.VSUIT1,
          number: 9,
          count: 4,
        },
      ],
    },
    {
      description: "33 66 99 3333 3333 (Any 3 Suits, Like Kongs 3, 6, or 9)",
      vsuitCount: 3,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 3,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: 6,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: 9,
          count: 2,
        },
        {
          suit: SUIT.VSUIT2,
          number: 3,
          count: 4,
        },
        {
          suit: SUIT.VSUIT3,
          number: 3,
          count: 4,
        },
      ],
    },
    {
      description: "33 66 99 3333 3333 (Any 3 Suits, Like Kongs 3, 6, or 9)",
      vsuitCount: 3,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 3,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: 6,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: 9,
          count: 2,
        },
        {
          suit: SUIT.VSUIT2,
          number: 6,
          count: 4,
        },
        {
          suit: SUIT.VSUIT3,
          number: 6,
          count: 4,
        },
      ],
    },
    {
      description: "33 66 99 3333 3333 (Any 3 Suits, Like Kongs 3, 6, or 9)",
      vsuitCount: 3,
      concealed: false,
      odd: false,
      even: false,
      components: [
        {
          suit: SUIT.VSUIT1,
          number: 3,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: 6,
          count: 2,
        },
        {
          suit: SUIT.VSUIT1,
          number: 9,
          count: 2,
        },
        {
          suit: SUIT.VSUIT2,
          number: 9,
          count: 4,
        },
        {
          suit: SUIT.VSUIT3,
          number: 9,
          count: 4,
        },
      ],
    },
    {
      description: "FF 333 D 666 D 999 D (Any 3 Suits w Matching Dragons)",
      vsuitCount: 3,
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
          number: 3,
          count: 3,
        },
        {
          suit: SUIT.VSUIT1_DRAGON,
          number: 0,
          count: 1,
        },
        {
          suit: SUIT.VSUIT2,
          number: 6,
          count: 3,
        },
        {
          suit: SUIT.VSUIT2_DRAGON,
          number: 0,
          count: 1,
        },
        {
          suit: SUIT.VSUIT3,
          number: 9,
          count: 3,
        },
        {
          suit: SUIT.VSUIT3_DRAGON,
          number: 0,
          count: 1,
        },
      ],
    },
  ],
};
