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
        await page.wait_for_selector("#localizacaoNaviosPanel")

        print("Testing Phase 8 Flow...")

        # 1. Test GPS Table & Classification Rendering (T8.1, T8.2)
        navio_rows = await page.query_selector_all("#localizacaoNaviosTableBody tr")
        assert len(navio_rows) > 0, "Location rows expected"

        gps_text = await page.text_content("#localizacaoNaviosTableBody tr:first-child")
        assert "GPS" in gps_text or "° S" in gps_text or "° N" in gps_text, "GPS coordinates expected"
        print("1. GPS Table & Classification rendering passed.")

        # 2. Test ETA Calculation @ 33 km/h (T8.3)
        eta_calc = await page.evaluate("() => window.calcularEstimativaChegada(10200)")
        assert "12d 21h" in eta_calc or "33 km/h" in eta_calc, "ETA calculation expected"
        print("2. ETA Calculation @ 33 km/h passed.")

        # 3. Test Duration Counters (T8.4, T8.5, T8.6)
        perm_text = await page.evaluate("() => window.calcularTempoPermanenciaPorto(new Date(Date.now() - 86400000 * 2).toISOString())")
        assert "2d 0h" in perm_text, "Permanence counter expected"

        fora_text = await page.evaluate("() => window.calcularTempoForaPorto(new Date(Date.now() - 86400000 * 5).toISOString())")
        assert "5d 0h" in fora_text, "Time outside port counter expected"
        print("3. Duration Counters passed.")

        await page.screenshot(path="verification_phase8_final.png")
        print("Phase 8 verification complete! Screenshot saved.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
