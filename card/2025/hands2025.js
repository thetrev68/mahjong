import {SUIT, DRAGON} from "../../constants.js";

// Rules for describing hands
//  - put exact singles (non-virtual suit) first in components array
//      (E.g. single white dragon used as 0)

export const hands2025 = {
    groupDescription: "2025",
    hands: [
        {
            description: "FFFF 2025 222 222 (Any 3 Suits, Like Pungs 2s or 5s In Opp. Suits)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 1
                },
                {
                    suit: SUIT.FLOWER,
                    number: 0,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 2,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 2,
                    count: 4
                }
            ]
        },
        {
            description: "FFFF 2025 222 222 (Any 3 Suits, Like Pungs 2s or 5s In Opp. Suits)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: false,
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
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 1
                },                
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 1
                },                
                {
                    suit: SUIT.VSUIT2,
                    number: 2,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 2,
                    count: 3
                }
            ]
        },
        {
            description: "222 0000 222 5555 (Any 2 Suits)",
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
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 2,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 5,
                    count: 4
                }
            ]
        },
        {
            description: "2025 222 555 DDDD (Any 3 Suits)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 1
                },                
                {
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 2,
                    count: 1
                },                
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 2,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 5,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3_DRAGON,
                    number: 0,
                    count: 4
                }
            ]
        },
        {
            description: "FF 222 000 222 555 (Any 3 Suits)",
            vsuitCount: 3,
            concealed: true,
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
                    count: 3
                },
                {
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 2,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 5,
                    count: 3
                }
            ]
        }
    ]
};
