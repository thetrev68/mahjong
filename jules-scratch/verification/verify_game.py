from playwright.sync_api import Page, expect

def test_game_starts(page: Page):
    """
    This test verifies that the UI loads and the "Start Game" button is clickable.
    """
    # 1. Arrange: Go to the game's index.html page.
    page.goto("http://localhost:8000/index.html")

    # 2. Act: Find and click the "Start Game" button.
    start_button = page.locator("#start")
    expect(start_button).to_be_visible()
    start_button.click()

    # 3. Assert: Wait for a moment to let the game render.
    page.wait_for_timeout(1000)

    # 4. Screenshot: Capture the result.
    page.screenshot(path="jules-scratch/verification/verification.png")
