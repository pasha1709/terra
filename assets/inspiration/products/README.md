# Exact transparent product images required

Use matching PNG/WebP cutouts, with original proportions and no room background. These images are not supplied; no approximate replacements are used.

Living room: wave-vase.png (Ваза «Волна»), peach-bowl.png (Чаша «Персик»), chalk-mug.png (Кружка «Мел»).
Kitchen: celadon-teapot.png (Чайник «Селадон»), ochre-cups.png (Чашки «Охра»), brush-tableware.png (Посуда «Мазки»).
Bedroom: spiral-candlestick.png (Подсвечник «Спираль»), peach-vase.png (Ваза «Персик»), wave-bowl.png (Чаша «Волна»).

After supplying each file, set its corresponding hotspot.image in scenes.js to its actual path. requiredImage documents the expected file only and never creates broken image requests. Set scene.collectionUrl to the real room collection route. Keep productId null until an exact catalog match is confirmed. Existing price/ID adapters remain unchanged.
