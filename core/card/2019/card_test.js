import { debugPrint } from "../../../shared/DebugUtils.js";
import { TileData } from "../../models/TileData.js";
import { CardHand as Hand } from "../CardHand.js";

import { SUIT, DRAGON, WIND } from "../../../shared/GameConstants.js";

// PRIVATE GLOBALS

//  2019 card

export class CardTest {
  constructor(card) {
    this.card = card;
  }

  // Create various hands and test against the valid hands described in the card
  test() {
    {
      // FF 2019 1111 1111 (3 suits, kongs 2)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));

      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.CRACK, 1));
      hand.insertHidden(new TileData(SUIT.CRACK, 8));

      hand.insertHidden(new TileData(SUIT.BAM, 2));
      hand.insertHidden(new TileData(SUIT.BAM, 2));
      hand.insertHidden(new TileData(SUIT.BAM, 2));
      hand.insertHidden(new TileData(SUIT.BAM, 2));

      hand.insertHidden(new TileData(SUIT.DOT, 2));
      hand.insertHidden(new TileData(SUIT.DOT, 2));
      hand.insertHidden(new TileData(SUIT.DOT, 2));
      hand.insertHidden(new TileData(SUIT.DOT, 2));

      debugPrint("FF 2019 1111 1111 (3 suits, kongs 2)\n");

      const validationInfo = this.card.validateHand14(hand);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // 22 000 NEWS 111 88 (1 suit, concealed)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.CRACK, 2));

      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));

      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.WEST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));

      hand.insertHidden(new TileData(SUIT.CRACK, 1));
      hand.insertHidden(new TileData(SUIT.CRACK, 1));
      hand.insertHidden(new TileData(SUIT.CRACK, 1));

      hand.insertHidden(new TileData(SUIT.CRACK, 8));
      hand.insertHidden(new TileData(SUIT.CRACK, 8));

      debugPrint("22 000 NEWS 111 88 (1 suit, concealed)\n");

      const validationInfo = this.card.validateHand14(hand);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FFFF NNNN DD SSSS (red dragon only)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));

      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));

      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));

      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));

      debugPrint("FFFF NNNN DD SSSS (red dragon only)\n");

      const validationInfo = this.card.validateHand14(hand);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FF 22 44 66 88 22 22 (3 suits, any like even pairs, concealed)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));

      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));
      hand.insertHidden(new TileData(SUIT.CRACK, 6));
      hand.insertHidden(new TileData(SUIT.CRACK, 6));
      hand.insertHidden(new TileData(SUIT.CRACK, 8));
      hand.insertHidden(new TileData(SUIT.CRACK, 8));

      hand.insertHidden(new TileData(SUIT.BAM, 4));
      hand.insertHidden(new TileData(SUIT.BAM, 4));

      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));

      debugPrint(
        "FF 22 44 66 88 22 22 (3 suits, any like even pairs, concealed)\n",
      );

      const validationInfo = this.card.validateHand14(hand);
      this.card.printValidationInfo(validationInfo);
    }
  }
}
