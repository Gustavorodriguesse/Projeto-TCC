import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Set localStorage session
        await page.goto("http://localhost:3000/index.html")
        await page.evaluate("""() => {
            const session = {
                codigo_individual: 'SUP-2001',
                matricula: '888001',
                cargo: 'SUPERVISOR_GERENTE_OPERACOES',
                cargo_nome: 'Supervisor de Operações',
                nome: 'Carlos Supervisor',
                nivel: 'Nível Tático/Gestão',
                camada_visao: 'Visão Operacional'
            };
            localStorage.setItem('nexus_session', JSON.stringify(session));
        }""")

        await page.goto("http://localhost:3000/dashboard.html")
        await page.wait_for_selector("#cardsOperacionaisPanel:not(.hidden)")

        print("Testing Phase 6 Flow...")

        dialog_messages = []
        async def handle_dialog(dialog):
            dialog_messages.append(dialog.message)
            await dialog.accept()

        page.on("dialog", handle_dialog)

        # 1. Test Operational Cards (T6.1, T6.2, T6.3, T6.4)
        card_val = await page.text_content("#cardNaviosManutencaoVal")
        assert card_val is not None, "Card value expected"

        # Click on card for details
        await page.click("#cardsOperacionaisPanel > div.grid > div:first-child")
        await page.wait_for_timeout(300)
        assert any("DETALHAMENTO DO INDICADOR OPERACIONAL" in msg for msg in dialog_messages), "Card detail alert expected"
        print("1. Operational Cards & detail modal passed.")

        # 2. Test Operational Search (T6.7)
        await page.fill("#searchNavio", "MV Santos Star")
        await page.click('#searchOperacionalForm button[type="submit"]')
        await page.wait_for_timeout(300)
        assert any("PESQUISA OPERACIONAL CONCLUÍDA" in msg for msg in dialog_messages), "Search alert expected"
        print("2. Operational Search passed.")

        # 3. Test PDF Report A4 Generation (T6.8)
        pdf_btns = await page.query_selector_all('button:has-text("Relatório PDF")')
        if pdf_btns:
            await pdf_btns[0].click()
            await page.wait_for_timeout(300)
            assert any("Relatório PDF A4" in msg for msg in dialog_messages), "A4 PDF alert expected"
            print("3. PDF Report A4 generation passed.")

        # 4. Test Productivity Report (T6.9, T6.10)
        await page.wait_for_selector("#produtividadePanel:not(.hidden)")
        prod_count = await page.query_selector_all("#produtividadeTableBody tr")
        assert len(prod_count) > 0, "Productivity rows expected"
        print("4. Productivity Report passed.")

        await page.screenshot(path="verification_phase6_final.png")
        print("Phase 6 verification complete! Screenshot saved.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
