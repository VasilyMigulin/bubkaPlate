#!/usr/bin/env python3
"""Наблюдатель за папкой с фото продуктов.
Запуск:  python3 scripts/watch-photos.py
Кладёшь фото в «фото bubka plate» — скрипт сам кадрирует, сжимает,
кладёт в public/main и обновляет манифест. Dev-сервер подхватывает сразу.
Ctrl+C — остановить.
"""
import os, subprocess, time, sys

SRC = "/Users/proverka/bubka2/фото bubka plate"
DST = os.path.join(os.path.dirname(__file__), "..", "public", "main")
MANIFEST = os.path.join(os.path.dirname(__file__), "..", "src", "data", "mainPhotos.ts")
DST = os.path.abspath(DST)
MANIFEST = os.path.abspath(MANIFEST)

# русское имя файла (без .jpg) -> id продукта в каталоге
MAP = {
 'абрикос':'apricot','авокадо':'avocado','ананас':'pineapple','апельсин':'orange','арахис':'peanut','арбуз':'watermelon',
 'баклажан':'eggplant','банан':'banana','батат':'sweetpotato','болгарский перец':'bellpepper','брокколи':'broccoli',
 'виноград':'grape','вишня':'cherry','вода':'water','говядина':'beef','гранат':'pomegranate','гречка':'buckwheat','грибы':'mushroom','груша':'pear',
 'дыня':'melon','зеленый горошек':'peas','зелень салат':'greens','йогурт':'yogurt','индейка':'turkey','инжир':'fig','кабачок':'zucchini',
 'капуста белокачанная':'cabbage','капуста брюссельская':'brussels','картофель':'potato','киви':'kiwi','клубника':'strawberry',
 'компот':'compote','креветки':'shrimp','кролик':'rabbit','крыжовник':'gooseberry','кукуруза':'corn','кукурузная каша':'corn_porr','кунжут':'sesame','курица':'chicken',
 'лимон лайм':'lemon','лосось':'salmon','лук чеснок':'onion','макароны':'pasta','малина':'raspberry','манго':'mango','мандарин':'mandarin',
 'масло растительное':'oil','масло':'oil','молоко':'cowmilk','морковь':'carrot','нектарин':'nectarine','нут':'chickpea','овсянка':'oats','огурец':'cucumber','персик':'peach',
 'печень':'liver','помидор':'tomato','пшеница':'wheat','пшенная':'millet','редис':'radish','рис':'rice','свекла':'beet','слива':'plum',
 'смородина':'currant','сок':'juice','специи':'spices','стручковая фасоль':'greenbeans','сухофрукты':'driedfruit','сыр':'cheese','творог':'cottage',
 'тофу':'tofu','треска':'cod','тыква':'pumpkin','хурма':'persimmon','цветная капуста':'cauliflower','черешня':'sweetcherry','черника':'blueberry',
 'чернослив':'prune','чечевица':'lentils','шпинат':'spinach','яблоко':'apple','яйцо':'egg',
}

def sh(*args):
    subprocess.run(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def process(src_path, fid):
    w = int(subprocess.run(['sips','-g','pixelWidth',src_path],capture_output=True,text=True).stdout.split()[-1])
    h = int(subprocess.run(['sips','-g','pixelHeight',src_path],capture_output=True,text=True).stdout.split()[-1])
    s = min(w, h)
    sh('sips','-c',str(s),str(s),src_path,'--out','/tmp/_watch_crop.jpg')          # квадрат по центру
    sh('sips','-s','format','jpeg','-Z','700','/tmp/_watch_crop.jpg','--out',os.path.join(DST, fid+'.jpg'))

def regen_manifest():
    files = sorted(f for f in os.listdir(DST) if not f.startswith('.'))
    with open(MANIFEST, 'w') as f:
        f.write('// Собственные главные фото продуктов (public/main), путь по id. Отдельно от PDF-фото нарезки.\n')
        f.write('export const MAIN_PHOTOS: Record<string, string> = {\n')
        for fn in files:
            f.write(f"  {os.path.splitext(fn)[0]}: '/main/{fn}',\n")
        f.write('};\n')

def main():
    os.makedirs(DST, exist_ok=True)
    seen = {}  # src filename -> mtime
    print(f"👀 Слежу за папкой: {SRC}")
    print("   Кидай фото продуктов (рус. название = как в каталоге). Ctrl+C — стоп.\n")
    first = True
    while True:
        try:
            changed = False
            for fn in os.listdir(SRC):
                if not fn.lower().endswith('.jpg') or fn.startswith('.'):
                    continue
                path = os.path.join(SRC, fn)
                mt = os.path.getmtime(path)
                name = os.path.splitext(fn)[0]
                if seen.get(fn) == mt:
                    continue
                seen[fn] = mt
                fid = MAP.get(name)
                if not fid:
                    if not first:
                        print(f"  ⚠️  «{name}» — нет в списке продуктов, пропускаю (добавь в MAP при необходимости)")
                    continue
                process(path, fid)
                if not first:
                    print(f"  ✅ {name} → {fid}.jpg")
                changed = True
            if changed:
                regen_manifest()
                if not first:
                    print("  📋 список фото обновлён — приложение подхватит\n")
            first = False
            time.sleep(2)
        except KeyboardInterrupt:
            print("\n👋 Остановлено.")
            sys.exit(0)

if __name__ == '__main__':
    main()
