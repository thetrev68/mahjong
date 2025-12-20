import { debugPrint } from "../../../utils.js";
import { TileData } from "../../models/TileData.js";
import { CardHand as Hand } from "../CardHand.js";

import { SUIT, DRAGON, WIND } from "../../../shared/GameConstants.js";

// PRIVATE GLOBALS

// Test 2017 card

export class CardTest {
  constructor(card) {
    this.card = card;
  }

  // Create various hands and test against the valid hands described in the card
  test() {
    {
      // 222 0000 111 7777 (2 suits)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.BAM, 1));
      hand.insertHidden(new TileData(SUIT.BAM, 1));
      hand.insertHidden(new TileData(SUIT.BAM, 1));
      hand.insertHidden(new TileData(SUIT.BAM, 7));
      hand.insertHidden(new TileData(SUIT.BAM, 7));
      hand.insertHidden(new TileData(SUIT.BAM, 7));

      const singleTile = new TileData(SUIT.BAM, 7);

      debugPrint("222 0000 111 7777 (2 suits)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // 222 0000 111 7777 (2 suits)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DOT, 1));
      hand.insertHidden(new TileData(SUIT.DOT, 1));
      hand.insertHidden(new TileData(SUIT.DOT, 1));
      hand.insertHidden(new TileData(SUIT.DOT, 7));
      hand.insertHidden(new TileData(SUIT.DOT, 7));
      hand.insertHidden(new TileData(SUIT.DOT, 7));

      const singleTile = new TileData(SUIT.DOT, 7);

      debugPrint("222 0000 111 7777 (2 suits)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FF DDDD 2017 DDDD (2 or 3 suits)  2 suits
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.CRACK, 1));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));

      const singleTile = new TileData(SUIT.DRAGON, DRAGON.GREEN);

      debugPrint("FF DDDD 2017 DDDD (2 or 3 suits)  2 suits\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FF DDDD 2017 DDDD (2 or 3 suits)  3 suits
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DOT, 2));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DOT, 1));
      hand.insertHidden(new TileData(SUIT.DOT, 7));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));

      const singleTile = new TileData(SUIT.DRAGON, DRAGON.GREEN);

      debugPrint("FF DDDD 2017 DDDD (2 or 3 suits)  3 suits\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FF DDDD 2017 DDDD (2 or 3 suits)  3 suits
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.JOKER, 0));
      hand.insertHidden(new TileData(SUIT.DOT, 2));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DOT, 1));
      hand.insertHidden(new TileData(SUIT.DOT, 7));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.JOKER, 0));

      const singleTile = new TileData(SUIT.DRAGON, DRAGON.GREEN);

      debugPrint("FF DDDD 2017 DDDD (2 or 3 suits)  3 suits, using jokers\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FFFF 2 44 666 8888 (1 suit)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.DOT, 2));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 6));
      hand.insertHidden(new TileData(SUIT.DOT, 6));
      hand.insertHidden(new TileData(SUIT.DOT, 6));
      hand.insertHidden(new TileData(SUIT.DOT, 8));
      hand.insertHidden(new TileData(SUIT.DOT, 8));
      hand.insertHidden(new TileData(SUIT.DOT, 8));

      const singleTile = new TileData(SUIT.DOT, 8);

      debugPrint("FFFF 2 44 666 8888 (1 suit)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // 22 44 666 8888 DDDD (3 suits)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.DOT, 2));
      hand.insertHidden(new TileData(SUIT.DOT, 2));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.BAM, 6));
      hand.insertHidden(new TileData(SUIT.BAM, 6));
      hand.insertHidden(new TileData(SUIT.BAM, 6));
      hand.insertHidden(new TileData(SUIT.BAM, 8));
      hand.insertHidden(new TileData(SUIT.BAM, 8));
      hand.insertHidden(new TileData(SUIT.BAM, 8));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));

      const singleTile = new TileData(SUIT.DRAGON, DRAGON.RED);

      debugPrint("22 44 666 8888 DDDD (3 suits)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FF 1111 DDDD 1111 (3 suits, like numbers)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));

      hand.insertHidden(new TileData(SUIT.BAM, 4));
      hand.insertHidden(new TileData(SUIT.BAM, 4));
      hand.insertHidden(new TileData(SUIT.BAM, 4));
      hand.insertHidden(new TileData(SUIT.BAM, 4));

      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));

      const singleTile = new TileData(SUIT.DRAGON, DRAGON.RED);

      debugPrint("FF 1111 DDDD 1111 (3 suits, like numbers)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FFFF 4444 9999 13 (1 suit, lucky 13)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));

      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));

      hand.insertHidden(new TileData(SUIT.DOT, 9));
      hand.insertHidden(new TileData(SUIT.DOT, 9));
      hand.insertHidden(new TileData(SUIT.DOT, 9));
      hand.insertHidden(new TileData(SUIT.DOT, 9));

      hand.insertHidden(new TileData(SUIT.DOT, 1));

      const singleTile = new TileData(SUIT.DOT, 3);

      debugPrint("FFFF 4444 9999 13 (1 suit, lucky 13)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FFFF 4444 9999 13 (3 suit, lucky 13)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));

      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));

      hand.insertHidden(new TileData(SUIT.CRACK, 9));
      hand.insertHidden(new TileData(SUIT.CRACK, 9));
      hand.insertHidden(new TileData(SUIT.CRACK, 9));
      hand.insertHidden(new TileData(SUIT.CRACK, 9));

      hand.insertHidden(new TileData(SUIT.BAM, 1));

      const singleTile = new TileData(SUIT.BAM, 3);

      debugPrint("FFFF 4444 9999 13 (3 suit, lucky 13)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // NNNNN DDDD 11111 (quints, any wind, any dragon, any number/suit)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.BAM, 3));
      hand.insertHidden(new TileData(SUIT.BAM, 3));
      hand.insertHidden(new TileData(SUIT.BAM, 3));
      hand.insertHidden(new TileData(SUIT.BAM, 3));

      const singleTile = new TileData(SUIT.BAM, 3);

      debugPrint(
        "NNNNN DDDD 11111 (quints, any wind, any dragon, any number/suit)\n",
      );

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // NNNNN DDDD 11111 (quints, any wind, any dragon, any number/suit)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));

      const singleTile = new TileData(SUIT.CRACK, 7);

      debugPrint(
        "NNNNN DDDD 11111 (quints, any wind, any dragon, any number/suit)\n",
      );

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FF 11111 22 33333 (1 suit, 3 consecutive numbers)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));

      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));

      hand.insertHidden(new TileData(SUIT.CRACK, 4));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));

      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));

      const singleTile = new TileData(SUIT.CRACK, 5);

      debugPrint("FF 11111 22 33333 (1 suit, 3 consecutive numbers)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FF 1111 2222 3333 (3 suit, 3 consecutive numbers)
      const hand = new Hand();
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));

      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));

      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));

      hand.insertHidden(new TileData(SUIT.BAM, 5));
      hand.insertHidden(new TileData(SUIT.BAM, 5));
      hand.insertHidden(new TileData(SUIT.BAM, 5));

      const singleTile = new TileData(SUIT.BAM, 5);

      debugPrint("FF 1111 2222 3333 (3 suit, 3 consecutive numbers)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // 11 22 111 222 3333 (3 suit, 3 consecutive numbers)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));

      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));
      hand.insertHidden(new TileData(SUIT.DOT, 4));

      hand.insertHidden(new TileData(SUIT.BAM, 5));
      hand.insertHidden(new TileData(SUIT.BAM, 5));
      hand.insertHidden(new TileData(SUIT.BAM, 5));

      const singleTile = new TileData(SUIT.BAM, 5);

      debugPrint("11 22 111 222 3333 (3 suit, 3 consecutive numbers)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // 111 22 333 DDD DDD (3 consecutive numbers, 3 suits)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));

      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));

      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));

      const singleTile = new TileData(SUIT.DRAGON, DRAGON.WHITE);

      debugPrint("111 22 333 DDD DDD (3 consecutive numbers, 3 suits)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // NNNN EEEE WWWW SS
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));

      hand.insertHidden(new TileData(SUIT.WIND, WIND.WEST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.WEST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.WEST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.WEST));

      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));

      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));
      const singleTile = new TileData(SUIT.WIND, WIND.SOUTH);

      debugPrint("NNNN EEEE WWWW SS\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // NNNN DD DD DD SSSS (3 suits)
      const hand = new Hand();

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
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));

      const singleTile = new TileData(SUIT.DRAGON, DRAGON.WHITE);

      debugPrint(" NNNN DD DD DD SSSS (3 suits)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // 11 NNN 11 SSS 1111 (3 suits, any like odds)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));

      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.BAM, 3));
      const singleTile = new TileData(SUIT.BAM, 3);

      debugPrint("11 NNN 11 SSS 1111 (3 suits, any like odds) \n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // NN EE WW SS 11 11 11 (3 suits, like numbers)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.NORTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.SOUTH));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.WEST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.WEST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));
      hand.insertHidden(new TileData(SUIT.WIND, WIND.EAST));

      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.BAM, 3));
      const singleTile = new TileData(SUIT.BAM, 3);

      debugPrint("NN EE WW SS 11 11 11 (3 suits, like numbers) \n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // 11 22 33 44 55 66 77 (any 7 consecutive numbers in 1 suit)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));
      hand.insertHidden(new TileData(SUIT.CRACK, 4));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 6));
      hand.insertHidden(new TileData(SUIT.CRACK, 6));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.CRACK, 8));
      hand.insertHidden(new TileData(SUIT.CRACK, 8));
      hand.insertHidden(new TileData(SUIT.CRACK, 9));
      const singleTile = new TileData(SUIT.CRACK, 9);

      debugPrint(
        "11 22 33 44 55 66 77 (any 7 consecutive numbers in 1 suit) \n",
      );

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // 11 33 55 77 99 11 11 (3 suits, like odd pairs in opposite 2 suits)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.CRACK, 1));
      hand.insertHidden(new TileData(SUIT.CRACK, 1));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 3));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 5));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.CRACK, 9));
      hand.insertHidden(new TileData(SUIT.CRACK, 9));

      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.DOT, 3));
      hand.insertHidden(new TileData(SUIT.BAM, 3));
      const singleTile = new TileData(SUIT.BAM, 3);

      debugPrint(
        "11 33 55 77 99 11 11 (3 suits, like odd pairs in opposite 2 suits)\n",
      );

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }

    {
      // FF 2017 DD 2017 DD  (bams and craks only)
      const hand = new Hand();

      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.FLOWER, 0));
      hand.insertHidden(new TileData(SUIT.CRACK, 2));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.CRACK, 1));
      hand.insertHidden(new TileData(SUIT.CRACK, 7));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.RED));

      hand.insertHidden(new TileData(SUIT.BAM, 2));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.WHITE));
      hand.insertHidden(new TileData(SUIT.BAM, 1));
      hand.insertHidden(new TileData(SUIT.BAM, 7));
      hand.insertHidden(new TileData(SUIT.DRAGON, DRAGON.GREEN));
      const singleTile = new TileData(SUIT.DRAGON, DRAGON.GREEN);

      debugPrint("FF 2017 DD 2017 DD (bams and craks only)\n");

      const validationInfo = this.card.validateHand13(hand, singleTile);
      this.card.printValidationInfo(validationInfo);
    }
  }
}
