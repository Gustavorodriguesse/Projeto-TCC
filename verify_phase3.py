import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Set localStorage session with a route pre-populated
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

            const rotas = [
                { origem: 'Porto de Santos', destino: 'Porto de Roterdã', distancia: 10500, eta: '318.2 horas (~13.3 dias)' }
            ];
            localStorage.setItem('nexus_crud_rotas', JSON.stringify(rotas));
        }""")

        await page.goto("http://localhost:3000/dashboard.html")
        await page.wait_for_selector("#fluxoCargasPanel")

        print("Testing Phase 3 Flow...")

        # Unified dialog handler
        dialog_messages = []

        async def handle_dialog(dialog):
            dialog_messages.append(dialog.message)
            if "Contêiner" in dialog.message:
                await dialog.accept("CONT-992")
            elif "Navio" in dialog.message:
                await dialog.accept("MV Santos Star")
            elif "MOTIVO" in dialog.message or "motivo" in dialog.message or "Motivo" in dialog.message:
                await dialog.accept("Avaria de carga em pátio")
            else:
                await dialog.accept()

        page.on("dialog", handle_dialog)

        # 1. Test PRONTA_PARA_ENTREGA for item in ARMAZENAGEM (CRG-2026-002)
        pronta_btns = await page.query_selector_all('button:has-text("Pronta")')
        if pronta_btns:
            await pronta_btns[1].click()
            await page.wait_for_timeout(300)

        # 2. Test Supervisor Release (EM_TRANSITO)
        liberar_btns = await page.query_selector_all('button:has-text("Liberar")')
        if liberar_btns:
            await liberar_btns[1].click()
            await page.wait_for_timeout(300)

        # 3. Test Delivery Confirmation (T3.20 - T3.22)
        entregar_btns = await page.query_selector_all('button:has-text("Entregar")')
        if entregar_btns:
            await entregar_btns[1].click()
            await page.wait_for_timeout(300)
            assert any("ENTREGUE" in msg for msg in dialog_messages), "Delivery dialog expected"
            print("1. Delivery propagation test passed.")

        # 4. Test Cancellation with mandatory reason logging (T3.23 - T3.24)
        cancelar_btns = await page.query_selector_all('button:has-text("Cancelar")')
        if cancelar_btns:
            await cancelar_btns[2].click() # CRG-2026-003 in PRONTA_PARA_ENTREGA
            await page.wait_for_timeout(300)
            assert any("CANCELADA" in msg for msg in dialog_messages), "Cancellation dialog expected"
            print("2. Cancellation with mandatory reason test passed.")

        await page.screenshot(path="verification_phase3_final.png")
        print("Phase 3 full flow verification complete! Screenshot saved.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
