import {SUIT, WIND, DRAGON, VNUMBER} from "../../constants.js";

// Rules for describing hands
//  - Components must be in the exact order shown on the NMJL card
//  - This order is used for display in the hint panel

export const handsSinglesPairs = {
    groupDescription: "SinglesPairs",
    hands: [
        {
            description: "NN EW SS 11 22 33 44 (Any 1 Suit, Any 4 Consec Nos)",
            vsuitCount: 1,
            concealed: true,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.WIND,
                    number: WIND.NORTH,
                    count: 2
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.EAST,
                    count: 1
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.WEST,
                    count: 1
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.SOUTH,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE2,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE4,
                    count: 2
                }
            ]
        },
        {
            description: "FF 2468 DD 2468 DD (Any 2 Suits w Matching Dragons)",
            vsuitCount: 2,
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
                    suit: SUIT.VSUIT1_DRAGON,
                    number: 0,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 2,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 4,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 6,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 8,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2_DRAGON,
                    number: 0,
                    count: 2
                }
            ]
        },
        {
            description: "336699 336699 33 (Any 3 Suits, Pair 3, 6, or 9 in Third Suit)",
            vsuitCount: 3,
            concealed: true,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 6,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 9,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 3,
                    count: 2
                }
            ]
        },
        {
            description: "336699 336699 33 (Any 3 Suits, Pair 3, 6, or 9 in Third Suit)",
            vsuitCount: 3,
            concealed: true,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 6,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 9,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 6,
                    count: 2
                }
            ]
        },
        {
            description: "336699 336699 33 (Any 3 Suits, Pair 3, 6, or 9 in Third Suit)",
            vsuitCount: 3,
            concealed: true,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 6,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 6,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 9,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 9,
                    count: 2
                }
            ]
        },
        {
            description: "FF 11 22 11 22 11 22 (Any 3 Suits, Any 2 Consec Nos)",
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
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE2,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: VNUMBER.CONSECUTIVE2,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE2,
                    count: 2
                }
            ]
        },
        {
            description: "11 33 55 77 99 11 11 (Any 3 Suits, Pairs Any Like Odd Nos in Opp. Suits)",
            vsuitCount: 3,
            concealed: true,
            odd: true,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 7,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                }
            ]
        },
        {
            description: "FF 2025 2025 2025 (Any 3 Suits)",
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
                    count: 1
                },                
                {
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 3
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
                    count: 1
                },                
                {
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 2,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 5,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 2,
                    count: 1
                },                
                {
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 2,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 5,
                    count: 1
                }
            ]
        }
    ]
};
