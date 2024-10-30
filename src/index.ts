import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPluging from "puppeteer-extra-plugin-stealth";
import fs, { link } from "node:fs";
import { appendJsonToCsv } from "./component/json2csv";

puppeteer.use(StealthPluging());


(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            userDataDir: "profile",
        })

        const page = await browser.newPage();

        await page.goto('https://www.california-homeowners-associations.com/california_hoa_p_list.php?mastertable=california-counties&masterkey1=Los+Angeles&goto=52')
        for (let index = 60; index < 61; index++) {
            const element = `https://www.california-homeowners-associations.com/california_hoa_p_list.php?mastertable=california-counties&masterkey1=Los+Angeles&goto=${index}`;
            await page.goto(element, { timeout: 0, waitUntil: "networkidle2" })
            const links = await page.evaluate(() => {
                const links: Array<{ HOA: string; HOADetails: string }> = [];
                [...document.querySelectorAll('tbody > tr')].map((item) => {
                    let url = item.querySelector('a');
                    if (url !== null) {
                        links.push({
                            HOA: item.querySelector('td')!.innerText,
                            HOADetails: url.href
                        })
                    }
                })
                return links
            })
            console.log(links);
            const Data = await ScrapePageInfo(links, browser);
            appendJsonToCsv(Data, "results.csv");
        }
    } catch (error) {
        console.log(error)
    }
})()




async function ScrapePageInfo(links: Array<{ HOA: string; HOADetails: string }>, browser: Browser) {
    const newPage = await browser.newPage()
    let FinalResult: Array<{
        Type: string;
        Name: string;
        Address: string;
        Address2: string;
        City: string;
        State: string;
        Zip: string;
        Website: string;
    }> = []
    for (let index = 0; index < links.length; index++) {
        const element = links[index].HOADetails;
        console.log(index);
        if (!element.includes('caboard_list.php')) continue;
        try {

            await newPage.goto(element, { waitUntil: "networkidle2", timeout: 0 });
            const data = await newPage.evaluate((Hoa: string) => {
                let info: Array<{
                    Type: string;
                    Name: string;
                    Address: string;
                    Address2: string;
                    City: string;
                    State: string;
                    Zip: string;
                    Website: string;
                    HOA: string;
                }> = [];
                [...document.querySelectorAll("tbody > tr")].map((item) => {
                    let itemsr = item.querySelectorAll('td')
                    info.push({
                        Type: itemsr[0].innerText,
                        Name: itemsr[1].innerText,
                        Address: itemsr[2].innerText,
                        Address2: itemsr[3].innerText,
                        City: itemsr[4].innerText,
                        State: itemsr[5].innerText,
                        Zip: itemsr[6].innerText,
                        Website: itemsr[7].innerText,
                        HOA: Hoa
                    })
                });
                return info
            }, links[index].HOA)
            console.log(data)
            data.map((item) => FinalResult.push(item))
        } catch (error) {
            console.log(`failed to get ${element}`)
        }
    }
    await newPage.close();
    return FinalResult;
}
