import('./mobile/renderers/HandEventCoordinator.js').then(async module => {
  const { HandEventCoordinator } = module;
  
  // Mock GameController with event tracking
  const events = {};
  const mockGameController = {
    on: (eventName, handler) => {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName].push(handler);
      return () => {
        // Return unsubscribe function
        const idx = events[eventName].indexOf(handler);
        if (idx >= 0) {
          events[eventName].splice(idx, 1);
        }
      };
    }
  };
  
  // Mock HandRenderer
  const mockHandRenderer = {
    render: () => {},
    selectTile: () => {},
    clearSelection: () => {},
    tiles: [],
    selectionKeyByIndex: new Map()
  };
  
  // Create coordinator
  const coordinator = new HandEventCoordinator(mockGameController, mockHandRenderer, null);
  
  // Verify all 5 events are subscribed
  const expectedEvents = [
    'HAND_UPDATED',
    'TILE_SELECTED',
    'TILE_DRAWN',
    'TILE_DISCARDED',
    'HINT_DISCARD_RECOMMENDATIONS'
  ];
  
  console.log('Event Subscriptions:');
  expectedEvents.forEach(eventName => {
    const count = events[eventName]?.length || 0;
    if (count > 0) {
      console.log('✓ ' + eventName + ' (' + count + ' handler)');
    } else {
      console.log('✗ ' + eventName + ' (NOT SUBSCRIBED)');
    }
  });
  
  // Test destroy cleans up
  console.log('\nDestroy Test:');
  const unsubsBefore = coordinator.unsubscribeFns.length;
  coordinator.destroy();
  const unsubsAfter = coordinator.unsubscribeFns.length;
  console.log('✓ Unsubscribe functions before: ' + unsubsBefore);
  console.log('✓ Unsubscribe functions after: ' + unsubsAfter);
  
}).catch(e => console.error('Error:', e.message));
