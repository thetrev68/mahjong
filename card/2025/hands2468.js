import {SUIT, VNUMBER} from "../../constants.js";

// Rules for describing hands
//  - put exact singles (non-virtual suit) first in components array
//      (E.g. single white dragon used as 0)

export const hands2468 = {
    groupDescription: "2468",
    hands: [
        {
            description: "222 4444 666 8888 (Any 1 or 2 Suits)",
            vsuitCount: 1,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 4,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 8,
                    count: 4
                }
            ]
        },
        {
            description: "222 4444 666 8888 (Any 1 or 2 Suits)",
            vsuitCount: 2,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 4,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 6,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 8,
                    count: 4
                }
            ]
        },
        {
            description: "FF 2222 + 4444 = 6666 (Any 3 Suits)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.FLOWER,
                    number: 0,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 4,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 6,
                    count: 4
                }
            ]
        },
        {
            description: "FF 2222 + 6666 = 8888 (Any 3 Suits)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.FLOWER,
                    number: 0,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 6,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 8,
                    count: 4
                }
            ]
        },
        {
            description: "22 444 66 888 DDDD (Any 1 Suit)",
            vsuitCount: 1,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 4,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 8,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1_DRAGON,
                    number: 0,
                    count: 4
                }
            ]
        },
        {
            description: "FFFF 2468 222 222 (Any 3 Suits, Like Pungs, Any Even No.)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: true,
            components: [
                {
                    suit: SUIT.FLOWER,
                    number: 0,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 4,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 8,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 3
                }
            ]
        },
        {
            description: "FFF 22 44 666 8888 (Any 1 Suit)",
            vsuitCount: 1,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.FLOWER,
                    number: 0,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 4,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 8,
                    count: 4
                }
            ]
        },
        {
            description: "222 4444 666 88 88 (Any 3 Suits. Pairs 8s Only)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 4,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 8,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 8,
                    count: 2
                }
            ]
        },
        {
            description: "FF 2222 DDDD 2222 (Any 3 Suits, Like Kongs. Any Even No.)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: true,
            components: [
                {
                    suit: SUIT.FLOWER,
                    number: 0,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2_DRAGON,
                    number: 0,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 4
                }
            ]
        },
        {
            description: "22 44 66 88 222 222 (Any 3 Suits. Like Pungs. Any Even No.)",
            vsuitCount: 3,
            concealed: true,
            odd: false,
            even: true,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 4,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 8,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 3
                }
            ]
        }
    ]
};
