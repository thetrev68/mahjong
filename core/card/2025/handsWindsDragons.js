import {SUIT, WIND, DRAGON, VNUMBER} from "../../../constants.js";

// Rules for describing hands
//  - Components must be in the exact order shown on the NMJL card
//  - This order is used for display in the hint panel

export const handsWindsDragons = {
    groupDescription: "WindsDragons",
    hands: [
        {
            description: "NNNN EEE WWW SSS ()",
            vsuitCount: 0,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.WIND,
                    number: WIND.NORTH,
                    count: 4
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.EAST,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.WEST,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.SOUTH,
                    count: 4
                }
            ]
        },
        {
            description: "NNN EEEE WWWW SSS ()",
            vsuitCount: 0,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.WIND,
                    number: WIND.NORTH,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.EAST,
                    count: 4
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.WEST,
                    count: 4
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.SOUTH,
                    count: 3
                }
            ]
        },
        {
            description: "FF 123 DD DDD DDDD (Any 3 Consec Nos in Any 1 Suite, Any 3 Dragons)",
            vsuitCount: 1,
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
                    number: VNUMBER.CONSECUTIVE1,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE2,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE3,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2_DRAGON,
                    number: 0,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3_DRAGON,
                    number: 0,
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
            description: "FFF NN EE WWW SSSS ()",
            vsuitCount: 0,
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
                    suit: SUIT.WIND,
                    number: WIND.NORTH,
                    count: 2
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.EAST,
                    count: 2
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.WEST,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.SOUTH,
                    count: 4
                }
            ]
        },
        {
            description: "FFFF DDD NEWS DDD (Dragons Any 2 Suits)",
            vsuitCount: 2,
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
                    suit: SUIT.VSUIT1_DRAGON,
                    number: 0,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.NORTH,
                    count: 1
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
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2_DRAGON,
                    number: 0,
                    count: 3
                }
            ]
        },
        {
            description: "NNNN 1 11 111 SSSS (Any Like Odd Nos in 3 Suits)",
            vsuitCount: 3,
            concealed: false,
            odd: true,
            even: false,
            components: [
                {
                    suit: SUIT.WIND,
                    number: WIND.NORTH,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.SOUTH,
                    count: 4
                }
            ]
        },
        {
            description: "EEEE 2 22 222 WWWW (Any Like Even Nos in 3 Suits)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: true,
            components: [
                {
                    suit: SUIT.WIND,
                    number: WIND.EAST,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.WEST,
                    count: 4
                }
            ]
        },
        {
            description: "NN EEE WWW SS 2025 (2025 Any 1 Suit)",
            vsuitCount: 1,
            concealed: false,
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
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.WEST,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.SOUTH,
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
                }
            ]
        },
        {
            description: "NNN EE WW SSS 2025 (2025 Any 1 Suit)",
            vsuitCount: 1,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.WIND,
                    number: WIND.NORTH,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.EAST,
                    count: 2
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.WEST,
                    count: 2
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.SOUTH,
                    count: 3
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
                }
            ]
        },
        {
            description: "NN EE WWW SSS DDDD (Kong Any Dragon)",
            vsuitCount: 0,
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
                    count: 2
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.WEST,
                    count: 3
                },
                {
                    suit: SUIT.WIND,
                    number: WIND.SOUTH,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1_DRAGON,
                    number: 0,
                    count: 4
                }
            ]
        }
    ]
};
