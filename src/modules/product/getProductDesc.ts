import type { Page } from 'playwright';
import { log } from 'crawlee';

export async function getProductDesc(page: Page, selector: string) {
    try {
        // 将逗号分隔的选择器拆分成数组
        const selectors = selector.split(',').map(s => s.trim());

        for (const sel of selectors) {
            const elHandle = await page.$(sel);
            if (elHandle) {
                const productDesc = await elHandle.innerHTML();
                return productDesc || '';
            }
        }

        // 如果所有选择器都没匹配
        log.error(`无法找到简介选择器: ${selector}`);
        return '';
    } catch (err) {
        log.error(`获取简介时出错: ${selector}, 错误: ${err}`);
        return '';
    }
}
