import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Set localStorage session before navigation
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
        await page.wait_for_selector("#fluxoCargasTableBody")

        print("Testing Phase 5 Flow...")

        dialog_messages = []
        async def handle_dialog(dialog):
            dialog_messages.append(dialog.message)
            await dialog.accept()

        page.on("dialog", handle_dialog)

        # 1. Test QR Code Generation on Scheduling (T5.1, T5.2)
        await page.click("#toggleAgendamentoFormBtn")
        await page.wait_for_selector("#agendamentoCargaForm:not(.hidden)")

        await page.select_option("#agTipoCarga", "Grãos Soltos")
        await page.fill("#agPeso", "30.0")
        await page.fill("#agVolume", "50")
        await page.fill("#agValor", "100000")
        await page.fill("#agNatureza", "Agrícola")
        await page.fill("#agPortoDescarga", "Porto de Roterdã")
        await page.fill("#agDestino", "Roterdã")
        await page.fill("#agDataPrevista", "2026-10-15")

        await page.evaluate("() => document.querySelector('#agendamentoCargaForm button[type=\"submit\"]').click()")
        await page.wait_for_timeout(500)

        assert any("QR Code gerado automaticamente" in msg for msg in dialog_messages), "QR generation alert expected"
        print("1. QR Code generation on scheduling passed.")

        # 2. Test Display & PDF Print Modal (T5.2, T5.3, T5.4)
        etiqueta_btns = await page.query_selector_all('button:has-text("Etiqueta QR")')
        if etiqueta_btns:
            await etiqueta_btns[0].click()
            await page.wait_for_selector("#qrModal:not(.hidden)")

            modal_id = await page.text_content("#qrModalEntityId")
            assert modal_id and "CRG" in modal_id, "Modal entity ID expected"

            # Click Print PDF
            await page.click("#printEtiquetaBtn")
            await page.wait_for_timeout(500)
            assert any("Etiqueta PDF" in msg for msg in dialog_messages), "PDF alert expected"
            print("2. Display & PDF Print modal test passed.")

            await page.click("#closeQrModalBtn")

        # 3. Test Reprint with Log (T5.5)
        reimprimir_btns = await page.query_selector_all('button:has-text("Reimprimir")')
        if reimprimir_btns:
            await reimprimir_btns[0].click()
            await page.wait_for_selector("#qrModal:not(.hidden)")

            logs = await page.evaluate("() => JSON.parse(localStorage.getItem('nexus_audit_logs') || '[]')")
            assert any(l.get('tipo_alteracao') == 'Reimpressão de etiqueta' for l in logs), "Audit log entry for reprint expected"
            print("3. Reprint with audit log test passed.")

            await page.click("#closeQrModalBtn")

        # 4. Test Scanner Modal & Role-based Redirection (T5.6, T5.7, T5.8, T5.9)
        await page.click("#openQrScannerSidebarBtn")
        await page.wait_for_selector("#qrScannerModal:not(.hidden)")

        await page.fill("#simulatedQrInput", "QR-CRG-2026-001")
        await page.click("#simulateScanBtn")
        await page.wait_for_timeout(500)

        assert any("LEITURA DO QR CODE BEM-SUCEDIDA" in msg for msg in dialog_messages), "Scan success alert expected"
        print("4. Scanner modal & role-based scan test passed.")

        await page.screenshot(path="verification_phase5_final.png")
        print("Phase 5 verification complete! Screenshot saved.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
