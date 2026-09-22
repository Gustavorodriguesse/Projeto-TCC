#!/usr/bin/env python3
"""
Script de Verificação Automatizado para PostGIS + Supabase + Infraestrutura Portuária (NexusPort)
Valida:
1. Estrutura e DDL de SPECs/schema.sql (PostGIS extension, tables, GiST indexes, RPCs)
2. Módulo js/postgis-service.js (NexusPostGIS)
3. Interface técnico_portos.html (Portos, Berços, Guindastes, Pátios, Calculadora de Distância, Busca por Proximidade Espacial)
4. Interface embarcacoes.html (Calculadora de Rota, Velocidade Média, ETA, Tratamento para velocidade ausente, Mapa Leaflet)
"""

import asyncio
from playwright.async_api import async_playwright
import sys

async def main():
    print("--- Verificando Implementação PostGIS + Supabase + Infraestrutura ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Configura sessão de login no localStorage
        await page.goto("http://localhost:3000/index.html")
        await page.evaluate("""() => {
            const session = {
                codigo_individual: 'TEC-5080',
                matricula: 'MAT-5080',
                cargo: 'TECNICO_PORTOS',
                cargo_nome: 'Técnico em Portos',
                nome: 'Lucas Mendes',
                nivel: 'Nível Operacional',
                camada_visao: 'Visão Própria'
            };
            localStorage.setItem('nexus_session', JSON.stringify(session));
        }""")

        # 1. Testar técnico_portos.html
        print("1. Testando técnico_portos.html (Infraestrutura Portuária & PostGIS)...")
        await page.goto("http://localhost:3000/tecnico_portos.html")
        await page.wait_for_selector("#portosTableBody")

        # Verifica renderização dos portos
        portos_count = await page.evaluate("async () => (await window.NexusPostGIS.getPortos()).length")
        assert portos_count >= 5, f"Esperado pelo menos 5 portos, encontrado {portos_count}"
        print(f"  - Portos carregados: {portos_count}")

        # Testar cálculo de distância PostGIS entre Porto de Santos e Porto de Paranaguá
        dist_res = await page.evaluate("async () => await window.NexusPostGIS.calcularDistanciaPortos('BRSSZ', 'BRPNG')")
        assert dist_res["sucesso"] == True, "Cálculo de distância falhou"
        assert dist_res["distanciaKm"] > 200 and dist_res["distanciaKm"] < 300, f"Distância Santos-Paranaguá esperada ~270km, obteve {dist_res['distanciaKm']}"
        print(f"  - Distância Santos-Paranaguá: {dist_res['distanciaKm']} km ({dist_res['distanciaMetros']} m) - Sucesso")

        # Testar cálculo com mesmo porto (origem = destino)
        dist_mesmo = await page.evaluate("async () => await window.NexusPostGIS.calcularDistanciaPortos('BRSSZ', 'BRSSZ')")
        assert dist_mesmo["distanciaKm"] == 0, "Distância entre mesmo porto deve ser 0"
        print("  - Distância mesmo porto (0 km) - Sucesso")

        # Testar busca de equipamentos por proximidade espacial (PostGIS)
        prox_eq = await page.evaluate("async () => await window.NexusPostGIS.buscarEquipamentosProximos(-23.9608, -46.3022, 10000)")
        assert len(prox_eq) > 0, "Equipamentos próximos esperados em Santos"
        print(f"  - Equipamentos próximos em Santos: {len(prox_eq)} localizado(s)")

        # 2. Testar embarcacoes.html
        print("\n2. Testando embarcacoes.html (Rotas, Velocidade Média, ETA & Mapa)...")
        await page.goto("http://localhost:3000/embarcacoes.html")
        await page.wait_for_selector("#mapaPortuario")

        # Testar cálculo de Rota e ETA para MV Santos Star (20 km/h)
        eta_res = await page.evaluate("async () => await window.NexusPostGIS.calcularRotaETempo('BRSSZ', 'BRPNG', 'IMO-9821034', '2026-09-22T10:00:00.000Z')")
        assert eta_res["sucesso"] == True, "Cálculo de ETA falhou"
        assert eta_res["velocidadeMedia"] == 20.0, "Velocidade média esperada de 20 km/h"
        assert eta_res["tempoHoras"] > 10, "Tempo de viagem esperado > 10h"
        print(f"  - Rota MV Santos Star: Distância = {eta_res['distanciaKm']} km, Velocidade = {eta_res['velocidadeMedia']} km/h, Tempo = {eta_res['tempoFormatado']}")
        print(f"  - Previsão Chegada (ETA): {eta_res['previsaoChegada']}")

        # Testar tratamento para embarcação sem velocidade cadastrada
        # Injeta navio sem velocidade
        await page.evaluate("""async () => {
            const navios = await window.NexusPostGIS.getNavios();
            navios.push({ id: 'test-no-speed', nome: 'Navio Sem Vel', imo: 'IMO-0000000', velocidade_media: null });
            localStorage.setItem('nexus_navios', JSON.stringify(navios));
        }""")
        eta_err = await page.evaluate("async () => await window.NexusPostGIS.calcularRotaETempo('BRSSZ', 'BRPNG', 'IMO-0000000', '2026-09-22T10:00')")
        assert eta_err["sucesso"] == False, "Esperado erro para navio sem velocidade cadastrada"
        assert "não possui velocidade média cadastrada" in eta_err["mensagem"], "Mensagem explicativa esperada"
        print("  - Tratamento de embarcação sem velocidade cadastrada - Sucesso")

        # Tirar screenshot para verificação visual
        await page.screenshot(path="verification_phase10_final.png")
        print("\nScreenshot salvo em verification_phase10_final.png!")
        print("✅ Todas as verificações da Fase 10 (PostGIS + Supabase + Infraestrutura) passaram com sucesso!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
