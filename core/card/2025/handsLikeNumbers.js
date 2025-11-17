import {SUIT, VNUMBER} from "../../../constants.js";

// Rules for describing hands
//  - Components must be in the exact order shown on the NMJL card
//  - This order is used for display in the hint panel

export const handsLikeNumbers = {
    groupDescription: "LikeNumbers",
    hands: [
        {
            description: "FF 1111 D 1111 D 11 (Any 3 Suits)",
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
                    number: VNUMBER.CONSECUTIVE1,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT1_DRAGON,
                    number: 0,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT2,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 4
                },
                {
                    suit: SUIT.VSUIT2_DRAGON,
                    number: 0,
                    count: 1
                },
                {
                    suit: SUIT.VSUIT3,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                }
            ]
        },
        {
            description: "FFFF 11 111 111 11 (Any 3 Suits. Pairs Must Be Same Suit)",
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
                    number: VNUMBER.CONSECUTIVE1,
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
                },
                {
                    suit: SUIT.VSUIT1,
                    number: VNUMBER.CONSECUTIVE1,
                    count: 2
                }
            ]
        },
        {
            description: "FF 111 111 111 DDD (Any 3 Suits. Any Dragon)",
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
                    count: 3
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
                },
                {
                    suit: SUIT.VSUIT1_DRAGON,
                    number: 0,
                    count: 3
                }
            ]
        }
    ]
};
