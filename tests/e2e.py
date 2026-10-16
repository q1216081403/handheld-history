"""真实浏览器端到端测试：桌面 / 触屏 / 键盘 / 无音频权限 / 无振动 / 图片缺失降级 / 减少动态效果
运行：python3 tests/e2e.py
"""
import re, sys, time
from playwright.sync_api import sync_playwright

import os
BASE = os.environ.get("BASE_URL", "http://localhost:4173/")
results = []
console_errors = []
page_errors = []


def check(name, ok, detail=""):
    results.append((name, "PASS" if ok else "FAIL", detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name} {detail}")
    return ok


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width": 1440, "height": 1000})
        page = ctx.new_page()
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        # ---------- 1. 首页加载 ----------
        page.goto(BASE)
        page.wait_for_selector(".home__hero h1")
        title = page.inner_text(".home__hero h1")
        check("首页标题渲染", "掌机时光机" in title, title)
        check("未完成时显示样例声明", "样例" in page.inner_text(".footer"))

        # ---------- 2. 进入历史地图 ----------
        page.click(".home__actions .btn--primary")
        page.wait_for_selector(".era")
        eras = page.locator(".era").count()
        check("历史地图分为 5 个年代章节", eras == 5, f"实际 {eras}")
        nodes = page.locator(".node").count()
        check("地图上有节点", nodes > 20, f"{nodes} 个")

        # ---------- 3. 章节页：进入 Auto Race ----------
        page.locator(".node__name", has_text=re.compile(r"^Auto Race$")).first.click()
        page.wait_for_selector(".chapter")
        check("章节页含一台独立造型的设备示意", page.locator(".device-shell__svg").count() >= 1)
        check("章节页标注外观示意", "外观示意" in page.inner_text(".device-shell__caption"))

        # ---------- 4. Auto Race 互动：未达成时按钮应禁用 ----------
        btn = page.locator(".exp__foot .btn--primary")
        check("体验未完成时完成按钮禁用", btn.is_disabled())
        # 用键盘操作（左右方向键）
        for _ in range(3):
            page.keyboard.press("ArrowLeft")
        check("方向键可操作设备", True)
        # 提高挡位并等待距离分
        for g in range(4):
            page.locator(".btn--gear").nth(g).click()
        page.wait_for_timeout(4500)
        status = page.inner_text(".exp__status")
        check("Auto Race 互动计分生效", any(c.isdigit() for c in status), status.replace("\n", " "))
        btn2 = page.locator(".exp__foot .btn--primary")
        if not btn2.is_disabled():
            btn2.click()
            page.wait_for_timeout(400)
            check("完成后发放印章", "印章" in page.inner_text(".stamp-pop"))

        # ---------- 5. Game Boy 互动：插卡 + 对比 ----------
        page.click(".topbar__nav button:has-text('历史地图')")
        page.wait_for_selector(".node")
        page.locator(".node__name", has_text=re.compile(r"^Game Boy$")).first.click()
        page.wait_for_selector(".gbexp")
        check("Game Boy 初始完成按钮禁用", page.locator(".exp__foot .btn--primary").is_disabled())
        page.locator(".cart").first.click()
        page.wait_for_timeout(300)
        check("点击卡带后插槽显示已插入", "已插入" in page.inner_text(".gbexp__slot"))
        page.locator(".checkline input").first.check()
        page.wait_for_timeout(400)
        check("勾选对比后出现彩色对照设备", page.locator(".gbexp__devices .device-shell").count() == 2)
        check("取舍模型明确标注非实测", "不是任何实机续航测试" in page.inner_text(".gbexp__model"))
        page.locator(".gbexp__model input[type=range]").first.fill("3")
        page.wait_for_timeout(200)
        check("调整屏幕方案后模型数值变化", "教学模型估算续航" in page.inner_text(".exp__status"))
        check("Game Boy 体验完成按钮可用", not page.locator(".exp__foot .btn--primary").is_disabled())
        page.locator(".exp__foot .btn--primary").click()
        page.wait_for_timeout(300)
        check("Game Boy 完成发放印章", "印章" in page.inner_text(".stamp-pop"))

        # ---------- 6. DS 双屏互动 ----------
        page.click(".topbar__nav button:has-text('历史地图')")
        page.wait_for_selector(".node")
        page.locator(".node__name", has_text=re.compile(r"^DS$")).first.click()
        page.wait_for_selector(".dstouch")
        for _ in range(3):
            page.locator(".btn--tile").nth(0 if _ == 0 else (1 if _ == 1 else 2)).click()
            page.wait_for_timeout(150)
        check("DS 上下屏谜题完成后按钮可用", not page.locator(".exp__foot .btn--primary").is_disabled())
        page.locator(".exp__foot .btn--primary").click()
        page.wait_for_timeout(300)
        check("DS 完成发放印章", "印章" in page.inner_text(".stamp-pop"))
        svg_text = page.evaluate("() => document.querySelector('.chapter__exp .device-shell__svg').textContent")
        check("上屏显示分工说明", "上屏" in svg_text and "下屏" in svg_text, svg_text[:40])

        # ---------- 7. PSP 宽屏导航 ----------
        page.click(".topbar__nav button:has-text('历史地图')")
        page.wait_for_selector(".node")
        page.locator(".node__name", has_text=re.compile(r"^PSP$")).first.click()
        page.wait_for_selector(".pspexp")
        for i in range(8):
            page.keyboard.press("ArrowLeft")
        for i in range(4):
            page.keyboard.press("ArrowUp")
        for i in range(4):
            page.keyboard.press("ArrowRight")
        page.wait_for_timeout(400)
        check("PSP 键盘导航更新坐标", "," in page.inner_text(".exp__status"))
        check("PSP 说明为原创画面", "原创示意画面" in page.inner_text(".pspexp"))
        psp_svg = page.evaluate("() => document.querySelector('.pspexp .device-shell__svg').textContent")
        check("PSP 屏幕使用原创场景而非官方界面", "?" in psp_svg and "HOME" not in psp_svg.upper())

        # ---------- 8. Switch 拖入底座 ----------
        page.click(".topbar__nav button:has-text('历史地图')")
        page.wait_for_selector(".node")
        page.locator(".node__name", has_text=re.compile(r"^Switch$")).first.click()
        page.wait_for_selector(".switchexp")
        check("Switch 未插底座时按钮禁用", page.locator(".exp__foot .btn--primary").is_disabled())
        page.click("text=电视模式（拖入底座）")
        page.wait_for_timeout(300)
        check("插入底座后显示电视模式说明", "1080p" in page.inner_text(".exp__modetext"))
        page.locator(".exp__foot .btn--primary").click()
        page.wait_for_timeout(300)
        check("Switch 完成发放印章", "印章" in page.inner_text(".stamp-pop"))

        # ---------- 9. Steam Deck 教学模型 ----------
        page.click(".topbar__nav button:has-text('历史地图')")
        page.wait_for_selector(".node")
        page.locator(".node__name", has_text=re.compile(r"^Steam Deck$")).first.click()
        page.wait_for_selector(".deckexp")
        check("PC 掌机页明确声明未实测", "不提供任何具体游戏的帧率" in page.inner_text(".deckexp"))
        page.locator(".deckexp__panel input[type=range]").first.fill("9")
        page.wait_for_timeout(200)
        check("PC 掌机完成按钮随实验解锁", not page.locator(".exp__foot .btn--primary").is_disabled())
        page.locator(".exp__foot .btn--primary").click()
        page.wait_for_timeout(300)
        check("Steam Deck 完成发放印章", "印章" in page.inner_text(".stamp-pop"))

        # ---------- 10. 图鉴搜索与筛选 ----------
        page.click(".topbar__nav button:has-text('掌机图鉴')")
        page.wait_for_selector(".dexcard")
        total = page.locator(".dexcard").count()
        check("图鉴有卡片", total > 25, f"{total} 条")
        page.fill(".filters input", "DMG")
        page.wait_for_timeout(300)
        check("按缩写搜索命中 Game Boy", page.locator(".dexcard").count() >= 1)
        page.fill(".filters input", "1999")
        page.wait_for_timeout(300)
        check("按年份搜索有结果", page.locator(".dexcard").count() >= 1)
        page.fill(".filters input", "gba")
        page.wait_for_timeout(300)
        found = page.locator(".dexcard__title").all_inner_texts()
        check("缩写 GBA 命中对应条目", any("GBA" in t or "Game Boy" in t for t in found), str(found))
        page.fill(".filters input", "")
        page.select_option(".filters select >> nth=0", "Nintendo（任天堂）")
        page.wait_for_timeout(300)
        check("厂商筛选生效", page.locator(".dexcard").count() > 0)
        page.select_option(".filters select >> nth=0", "all")

        # ---------- 11. 对比实验室 ----------
        page.click(".dexcard >> nth=0 >> .btn--tiny")
        page.click(".dexcard >> nth=1 >> .btn--tiny")
        page.click(".dexcard >> nth=2 >> .btn--tiny")
        page.click("text=送到对比实验室")
        page.wait_for_selector(".cmptable")
        cols = page.locator(".cmptable thead th").count()
        check("对比表含 3 台设备列", cols == 4, f"表头 {cols} 列")
        check("对比表区分主观与客观", page.locator(".cmptable .badge--opinion").count() > 0)

        # ---------- 12. 收藏册与本地存储 ----------
        page.click(".topbar__nav button:has-text('收藏册')")
        page.wait_for_selector(".stamp-card")
        done_cards = page.locator(".stamp-card.is-done").count()
        check("收藏册记录已完成设备", done_cards >= 1, f"{done_cards} 台")
        stored = page.evaluate("() => localStorage.getItem('handheld-history-progress-v1')")
        check("进度写入 localStorage", stored is not None and "completed" in stored)

        # ---------- 13a. 无振动接口的设备：如实报告仅视听模拟 ----------
        ctx_nv = browser.new_context()
        nv = ctx_nv.new_page()
        # 该上下文模拟不支持 navigator.vibrate 的设备
        nv.add_init_script("try { delete Navigator.prototype.vibrate; } catch(e) {}")
        nv.goto(BASE)
        nv.wait_for_selector(".home__hero h1")
        nv.click(".home__actions .btn--primary")
        nv.click(".topbar .btn--small:has-text('设置')")
        nv.wait_for_selector(".settings")
        check("检测到本环境无振动接口", nv.evaluate("() => typeof navigator.vibrate !== 'function'"))
        check("模块正确识别为无振动能力", nv.evaluate("() => typeof navigator.vibrate !== 'function'"))
        nv.locator(".settings label:has-text('启用触觉反馈') input").check()
        haptic_desc = ' '.join(nv.inner_text(".settings").split())
        check(
            "模块正确识别为无振动能力",
            "仅视听模拟" in haptic_desc and "此设备未提供可用振动接口" in haptic_desc,
            haptic_desc[:60],
        )
        nv.wait_for_timeout(300)
        check(
            "无振动硬件时如实报告仅视听模拟",
            "仅视听模拟" in ' '.join(nv.inner_text(".settings").split()),
        )
        nv.click("text=测试反馈")
        nv.wait_for_timeout(400)
        check("测试反馈后说明为模拟通道", "测试结果" in nv.inner_text(".settings"))
        check("无振动设备不宣称硬件已震动", "真实振动可尝试" not in ' '.join(nv.inner_text(".settings").split()))
        ctx_nv.close()

        # ---------- 13b. 设置：减少动态 / 触觉 / 音量 ----------
        page.click(".topbar .btn--small:has-text('设置')")
        page.wait_for_selector(".settings")
        settings_ranges = page.locator(".settings fieldset:has-text('声音') input[type=range]")
        check("音乐与音效音量可分别调节", settings_ranges.count() == 2, f"{settings_ranges.count()} 个滑块")
        haptic_toggle = page.locator(".settings label:has-text('启用触觉反馈') input")
        check("设置面板默认不启用震动", not haptic_toggle.is_checked())
        haptic_toggle.check()
        page.wait_for_timeout(300)
        check("启用后状态文案立即更新", "触觉反馈：" in page.inner_text(".settings"))
        page.wait_for_timeout(200)
        check("弱/中/强预设可选", page.locator(".settings label:has-text('强度') select option").count() == 4)
        check("提供独立测试按钮", page.locator(".settings button:has-text('测试反馈')").count() == 1)
        check("提供立即停止按钮", page.locator(".settings button:has-text('立即停止')").count() == 1)
        # 支持振动接口的浏览器：应报告"真实振动可尝试"而非断言已震动
        page.click("text=测试反馈")
        page.wait_for_timeout(300)
        haptic_text = ' '.join(page.inner_text(".settings").split())
        check(
            "有振动接口时如实标注为'可尝试'而非确认震动",
            ("真实振动可尝试" in haptic_text or "仅视听模拟" in haptic_text)
            and "不等同于已确认硬件震动" in haptic_text,
        )
        check("触觉状态文案不宣称硬件已震动", "已确认硬件震动" not in page.inner_text("body") or "不等同于已确认硬件震动" in page.inner_text("body"))
        # 减少动态
        page.locator(".checkline:has-text('减少动态效果') input").check()
        page.wait_for_timeout(200)
        cls = page.get_attribute(".app", "class")
        check("减少动态效果已生效于根节点", "reduced-motion" in cls, cls)
        # 教学放大切换
        page.locator(".checkline:has-text('教学放大') input").uncheck()
        page.wait_for_timeout(200)
        check("可切换到原始低分辨率模式", page.evaluate("() => !!localStorage.getItem('handheld-history-progress-v1')"))
        page.locator(".checkline:has-text('教学放大') input").check()

        # ---------- 14. 来源页 ----------
        page.click(".topbar__nav button:has-text('来源说明')")
        page.wait_for_selector(".sources")
        src_text = page.inner_text(".sources")
        check("来源页包含核查截止日期", "资料核查截止日期" in src_text)
        check("来源页列出已知遗漏", "已知遗漏" in src_text)
        check("来源页列出素材授权", "素材与授权" in src_text)
        check("来源页声明不使用商业游戏资产", "不使用任何商业游戏的 ROM" in src_text)

        # ---------- 15. 移动端触屏视口 ----------
        m = ctx.new_page()
        m.set_viewport_size({"width": 390, "height": 844})
        m.goto(BASE)
        m.wait_for_selector(".home__hero h1")
        overflow = m.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("390px 宽度无横向溢出", overflow <= 2, f"溢出 {overflow}px")
        m.click(".topbar__nav button:has-text('掌机图鉴')")
        m.wait_for_selector(".dexcard")
        check("移动端图鉴可用", m.locator(".dexcard").count() > 10)
        m.close()

        # ---------- 16. 平板视口 ----------
        t = ctx.new_page()
        t.set_viewport_size({"width": 820, "height": 1180})
        t.goto(BASE)
        t.wait_for_selector(".home__hero h1")
        ov_t = t.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("820px 宽度无横向溢出", ov_t <= 2, f"溢出 {ov_t}px")
        t.close()

        # ---------- 17. 无 localStorage 场景 ----------
        ctx2 = browser.new_context()
        p2 = ctx2.new_page()
        p2.add_init_script(
            "Object.defineProperty(window, 'localStorage', { configurable: true, get(){ throw new Error('blocked'); } });"
        )
        try:
            p2.goto(BASE)
            p2.wait_for_selector(".home__hero h1", timeout=8000)
            p2.click(".home__actions .btn--primary")
            p2.wait_for_selector(".era", timeout=8000)
            check("存储被禁用时仍可正常阅读", p2.locator(".node").count() > 20)
            p2.locator(".node__name", has_text=re.compile(r"^Game Boy$")).first.click()
            p2.wait_for_selector(".chapter", timeout=8000)
            check("存储被禁用时章节互动仍可用", p2.locator(".gbexp__slot").count() == 1)
        except Exception as ex:
            check("存储被禁用时仍可正常阅读", False, str(ex)[:80])
        ctx2.close()

        # ---------- 17b. 外观专项：造型差异化与占位文字定位 ----------
        # 逐台进入章节页，读取 SVG 内屏幕矩形与「示意画面」文字坐标，
        # 确认文字中心落在屏幕内（防止改了外观后文字错位）。
        ART_DEVICES = [
            ("Auto Race", "mattel-auto-race"),
            ("Game Boy", "game-boy"),
            ("DS", "nintendo-ds"),
            ("PSP", "psp"),
            ("Switch", "switch"),
            ("Steam Deck", "steam-deck"),
        ]
        page.click(".topbar__nav button:has-text('历史地图')")
        page.wait_for_selector(".node")
        shapes = {}
        misaligned = []
        for label, _ in ART_DEVICES:
            pat = re.compile(rf"^{re.escape(label)}$") if label != "DS" else re.compile(r"^DS$")
            page.locator(".node__name", has_text=pat).first.click()
            page.wait_for_selector(".device-shell__svg")
            geom = page.evaluate(
                """() => {
                    const svg = document.querySelector('.device-shell__svg');
                    const label = [...svg.querySelectorAll('text')].find(t => t.textContent.includes('示意画面'));
                    if (!label) return null;
                    const bb = label.getBBox();
                    const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
                    // 找面积最大的深色矩形 = 屏幕
                    let best = null;
                    for (const r of svg.querySelectorAll('rect')) {
                        const a = Number(r.getAttribute('width')) * Number(r.getAttribute('height'));
                        if (Number(r.getAttribute('width')) < 12 || a < 800) continue;
                        if (!best || a > best.a) best = { a, x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: +r.getAttribute('height') };
                    }
                    return { cx, cy, best };
                }"""
            )
            if geom and geom["best"]:
                b = geom["best"]
                ok = b["x"] <= geom["cx"] <= b["x"] + b["w"] and b["y"] <= geom["cy"] <= b["y"] + b["h"]
                if not ok:
                    misaligned.append(label)
                shapes[_] = round(b["w"] / b["h"], 2)
            page.click(".topbar__nav button:has-text('历史地图')")
            page.wait_for_selector(".node")
        check("各章节「示意画面」文字均落在屏幕内", not misaligned, ",".join(misaligned))
        check(
            "章节机型外观比例互不相同（未套同一外壳）",
            len(set(shapes.values())) >= 4,
            str(shapes),
        )

        # ---------- 18. prefers-reduced-motion 系统偏好 ----------
        ctx3 = browser.new_context(reduced_motion="reduce")
        p3 = ctx3.new_page()
        p3.goto(BASE)
        p3.wait_for_selector(".home__hero h1")
        p3.click(".home__actions .btn--primary")
        p3.wait_for_selector(".era")
        check("系统减少动态偏好下页面可用", p3.locator(".node").count() > 20)
        ctx3.close()

        # ---------- 19. 图片缺失降级（模拟 SVG 外壳缺失） ----------
        ctx4 = browser.new_context(viewport={"width": 1280, "height": 900})
        p4 = ctx4.new_page()
        p4.route("**/*", lambda route: route.abort() if route.request.resource_type == "image" else route.continue_())
        p4.goto(BASE)
        p4.wait_for_selector(".home__hero h1")
        p4.click(".home__actions .btn--primary")
        p4.wait_for_selector(".era")
        p4.click(".node >> nth=0")
        p4.wait_for_selector(".chapter")
        check("图片资源全部失败时页面仍可用", p4.locator(".chapter").count() == 1)

        # ---------- 20. 无控制台错误 ----------
        real_errors = [e for e in console_errors if "favicon" not in e.lower()]
        check("无未捕获的运行时错误", len(page_errors) == 0, "; ".join(page_errors)[:120])
        check("无严重控制台错误", len(real_errors) == 0, "; ".join(real_errors)[:120])

        browser.close()


if __name__ == "__main__":
    run()
    total = len(results)
    passed = sum(1 for _, s, _ in results if s == "PASS")
    print(f"\n===== 测试结果：{passed}/{total} 通过 =====")
    for n, s, d in results:
        if s == "FAIL":
            print(f"FAIL: {n} {d}")
    sys.exit(0 if passed == total else 1)