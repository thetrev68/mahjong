import {SUIT, DRAGON, WIND} from "../../constants.js";

// Rules for describing hands
//  - Components must be in the exact order shown on the NMJL card
//  - This order is used for display in the hint panel

export const hands13579 = {
    groupDescription: "13579",
    hands: [
        {
            description: "11 333 5555 777 99 (Any 1 or 3 Suits)",
            vsuitCount: 1,
            concealed: false,
            odd: false,
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
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 7,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 2
                }
            ]
        },
        {
            description: "11 333 5555 777 99 (Any 1 or 3 Suits)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
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
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 5,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 7,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 9,
                    count: 2
                }
            ]
        },
        {
            description: "111 3333 333 555 (Any 2 Suits)",
            vsuitCount: 2,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 1,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 3,
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
            description: "555 7777 777 9999 (Any 2 Suits)",
            vsuitCount: 2,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 7,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 7,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 9,
                    count: 4
                }
            ]
        },
        {
            description: "1111 333 5555 DDD (Any 1 Suit)",
            vsuitCount: 1,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 1,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1_DRAGON,
                    number: 0,
                    count: 3
                }
            ]
        },
        {
            description: "5555 777 9999 DDD (Any 1 Suit)",
            vsuitCount: 1,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 7,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1_DRAGON,
                    number: 0,
                    count: 3
                }
            ]
        },
        {
            description: "FFFF 1111 + 9999 = 10 (Any 2 Suits, These Nos Only)",
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
                    suit: SUIT.VSUIT1,
                    number: 1,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 1,
                    count: 1
                },
                {
                    suit: SUIT.DRAGON,
                    number: DRAGON.WHITE,
                    count: 1
                }
            ]
        },
        {
            description: "FFF 135 7777 9999 (Any 1 or 3 Suits)",
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
                    number: 1,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 7,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 4
                }
            ]
        },
        {
            description: "FFF 135 7777 9999 (Any 1 or 3 Suits)",
            vsuitCount: 3,
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
                    number: 1,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 7,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 9,
                    count: 4
                }
            ]
        },
        {
            description: "111 333 555 DD DD (Any 3 Suits w/ Opp. Dragons)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 1,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2_DRAGON,
                    number: 0,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3_DRAGON,
                    number: 0,
                    count: 2
                }
            ]
        },
        {
            description: "555 777 9999 DD DD (Any 3 Suits w/ Opp. Dragons)",
            vsuitCount: 3,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 7,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2_DRAGON,
                    number: 0,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT3_DRAGON,
                    number: 0,
                    count: 2
                }
            ]
        },
        {
            description: "11 333 NEWS 333 55 (Any 2 Suits)",
            vsuitCount: 2,
            concealed: false,
            odd: false,
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
                    suit: SUIT.VSUIT2,
                    number: 3,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 5,
                    count: 2
                }
            ]
        },
        {
            description: "55 777 NEWS 777 99 (Any 2 Suits)",
            vsuitCount: 2,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 5,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 7,
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
                    suit: SUIT.VSUIT2,
                    number: 7,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 9,
                    count: 2
                }
            ]
        },
        {
            description: "1111 33 55 77 9999 (Any 2 Suits)",
            vsuitCount: 2,
            concealed: false,
            odd: false,
            even: false,
            components: [
                {
                    suit: SUIT.VSUIT1,
                    number: 1,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 5,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 7,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 9,
                    count: 4
                }
            ]
        },
        {
            description: "FF 11 33 111 333 55 (Any 3 Suits)",
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
                    number: 1,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 3,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 1,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 3,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 5,
                    count: 2
                }
            ]
        },
        {
            description: "FF 55 77 555 777 99 (Any 3 Suits)",
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
                    number: 5,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT1,
                    number: 7,
                    count: 2
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 5,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT2,
                    number: 7,
                    count: 3
                },
                {
                    suit: SUIT.VSUIT3,
                    number: 9,
                    count: 2
                }
            ]
        }
    ]
};
