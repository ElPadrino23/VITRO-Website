/* ============================================================
   VITRO ASCII — intro animada del logo en caracteres de colores
   Sin dependencias. El logo es el vectorizado de tu PNG (Path2D).
   API:
     VitroAscii.play({ onDone })            -> corre la secuencia y llama onDone al terminar
     VitroAscii.attachEasterEgg(el, taps)   -> triple tap en `el` repite la secuencia
   ============================================================ */
const VitroAscii = (() => {
  const COLS = 110;
  let ROWS = 54;
  const RAMP = " .:-=+*#%@";
  const GLITCH = "01<>/\\|+-*#%&$";
  const COLORS = ["#1E3A8A", "#0EA5A4", "#2FA36B", "#9B1C4B"];   // navy → turquesa → verde → vino
  const MONO = "ui-monospace, Menlo, Consolas, 'Courier New', monospace";
  const SANS = "Montserrat, 'Arial Black', 'Helvetica Neue', Arial, sans-serif";

  // Logo vectorizado (coordenadas en px del recorte, 1206 x 1008)
  const LOGO = new Path2D("M 348.4 37.2 C 348.0 38.2, 364.1 77.1, 372.9 96.5 C 373.9 98.7, 375.8 102.9, 377.2 106 C 378.6 109.0, 391.0 137.8, 404.8 170 C 418.6 202.1, 431.0 230.8, 432.4 233.7 C 433.8 236.6, 435 239.4, 435 240.0 C 435 240.6, 435.6 242.3, 436.3 243.8 C 438.9 248.7, 442.6 257.2, 458.9 295.5 C 467.9 316.4, 475.6 333.9, 476.1 334.4 C 476.5 334.9, 477 335.9, 477 336.7 C 477 337.4, 478.3 340.8, 479.9 344.2 C 481.4 347.6, 483.7 352.9, 485.0 356 C 486.2 359.0, 488.3 363.9, 489.6 367 C 491.0 370.0, 492.7 373.8, 493.4 375.5 C 494.2 377.1, 495.9 380.9, 497.2 384 C 498.6 387.0, 507.0 406.6, 516.0 427.5 C 536.5 475.5, 537.5 477.5, 539.5 478.3 C 542.9 479.6, 636.5 479.0, 638.2 477.7 C 639.0 477.0, 640.9 474.0, 642.2 471 C 643.6 467.9, 646.1 462.4, 647.8 458.7 C 649.5 455.0, 651 451.7, 651 451.4 C 651 451.1, 652.0 448.5, 653.3 445.6 C 654.6 442.8, 661.0 428.1, 667.4 413.0 C 673.9 397.9, 679.5 384.9, 680.0 384.0 C 683.2 377.5, 687 368.8, 687 367.7 C 687 366.9, 687.4 365.9, 687.8 365.4 C 688.3 364.9, 694.0 352.1, 700.5 337.0 C 706.9 321.9, 712.5 308.9, 713.0 308.0 C 713.4 307.1, 714.4 304.9, 715.2 303 C 718.4 295.6, 723.3 284.3, 725.5 279.5 C 726.7 276.7, 732.3 263.7, 737.9 250.5 C 743.6 237.3, 749.2 224.3, 750.6 221.6 C 751.9 219.0, 753 216.4, 753 215.9 C 753 215.4, 754.1 212.6, 755.5 209.7 C 756.9 206.8, 763.9 190.7, 771.1 174 C 778.3 157.2, 785.2 141.3, 786.6 138.6 C 787.9 136.0, 789 133.4, 789 132.8 C 789 132.3, 790.2 129.1, 791.8 125.7 C 796.5 115.6, 802.6 101.9, 805.0 96 C 806.2 92.9, 807.8 89.1, 808.6 87.5 C 813.9 76.1, 829.2 40.1, 829.3 38.5 C 829.4 36.6, 828.7 36.4, 820.2 36.2 L 811.0 35.9 808.1 42.2 C 806.5 45.6, 802.6 54.5, 799.4 62 C 793.5 75.9, 793.2 76.7, 785.7 93.5 C 783.2 99, 778.6 109.5, 775.5 117 C 770.1 129.6, 765.8 139.4, 763.9 143.0 C 763.5 143.9, 760.6 150.6, 757.4 158.0 C 754.3 165.4, 750.6 173.9, 749.2 177 C 747.8 180.0, 745.9 184.3, 744.9 186.5 C 743.9 188.7, 738.8 200.4, 733.6 212.5 C 719.8 244.5, 716.3 252, 714.6 252 C 713.7 252, 709.2 250.2, 704.6 248 C 699.9 245.8, 695.8 244, 695.4 244 C 695.1 244, 692.3 242.8, 689.1 241.4 C 686.0 239.9, 681.1 237.7, 678.2 236.4 C 675.3 235.0, 672.5 234, 672.0 234 C 669.3 234, 674.0 220.7, 685.3 196.5 C 688.2 190.1, 694.1 176.8, 701.0 161 C 704.9 151.9, 709.6 141.1, 711.4 137 C 713.2 132.8, 717.7 122.5, 721.4 114 C 725.1 105.4, 729.3 95.8, 730.9 92.5 C 732.4 89.2, 736.9 79.0, 740.7 70 C 744.6 60.9, 749.2 50.5, 750.9 47 C 756.1 35.8, 756.1 35.8, 741.7 36.2 L 729.5 36.5 726.3 43 C 724.5 46.5, 721.6 52.8, 719.9 57 C 718.1 61.1, 715.0 68.3, 712.9 73 C 710.9 77.6, 702.5 97.0, 694.4 116 C 686.3 134.9, 677.9 154.2, 675.8 158.7 C 673.7 163.3, 672 167.4, 672 167.9 C 672 168.4, 671.2 170.3, 670.3 172.1 C 667.9 177.0, 668.3 175.9, 653.9 209.5 C 638.3 246.1, 627.8 270.4, 624.3 278 C 622.9 281.0, 615.4 298.3, 607.6 316.4 C 599.8 334.5, 592.9 349.5, 592.3 349.7 C 591.6 349.9, 590.8 349.0, 590.4 347.8 C 590.0 346.5, 588.7 343.2, 587.5 340.5 C 586.2 337.7, 572.3 305.1, 556.5 268 C 527.4 199.7, 525.5 195.4, 522.5 188.7 C 521.6 186.7, 520.3 183.2, 519.5 181.1 C 518.7 178.9, 517.0 174.7, 515.6 171.8 C 514.3 168.9, 500.9 137.7, 485.9 102.5 C 470.9 67.3, 458.2 37.9, 457.7 37.2 C 456.3 35.4, 349.1 35.4, 348.4 37.2 M 1021 719.1 C 974.6 722.9, 933.5 750.0, 914.4 789.5 C 904.8 809.3, 902.7 819.2, 902.6 845 C 902.5 868.3, 902.9 871.3, 909.2 889.3 C 929.9 949.3, 997.5 983.8, 1067.0 969.9 C 1119.8 959.4, 1155.5 924.9, 1168.6 872 C 1171.5 860.3, 1171.2 829.8, 1168.1 817.1 C 1156.1 767.6, 1121.2 734.0, 1069 721.6 C 1063.6 720.3, 1035.1 717.6, 1032.3 718.1 C 1031.8 718.2, 1026.7 718.6, 1021 719.1 M 37 723.9 C 37 724.8, 66.2 793.6, 70.5 802.6 C 71.9 805.5, 73 808.1, 73 808.4 C 73 808.8, 74.5 812.3, 76.3 816.2 C 78.2 820.2, 81.4 827.5, 83.4 832.5 C 85.4 837.4, 87.5 842.1, 87.9 843.0 C 88.3 843.8, 96.0 861.6, 104.9 882.5 C 113.9 903.4, 121.6 920.9, 122.1 921.4 C 122.5 921.9, 123 922.9, 123 923.6 C 123 924.4, 124.3 928.0, 126.0 931.7 C 127.7 935.4, 130.5 941.6, 132.1 945.5 C 138.3 959.4, 141.0 965.5, 141.8 967 C 143.0 969.0, 197.1 969.7, 198.7 967.7 C 199.2 967.0, 207.7 947.8, 217.5 925 C 227.2 902.1, 235.6 882.8, 236.0 882 C 236.4 881.1, 238.2 877.1, 239.9 873 C 241.7 868.8, 243.9 863.7, 245.0 861.5 C 246.0 859.3, 254.5 839.5, 263.9 817.5 C 280.6 778.6, 282.6 774.1, 287.4 763.5 C 293.2 750.9, 304 725.2, 304 724.1 C 304 723.2, 302.4 722.9, 298.7 723.1 L 293.5 723.5 290.7 728.9 C 289.2 731.9, 287.7 735.3, 287.3 736.4 C 287.0 737.5, 285.3 741.4, 283.7 745 C 280.8 751.1, 275.2 764.0, 255.4 809.7 C 250.7 820.6, 246.2 830.0, 245.5 830.8 C 244.5 831.9, 243.1 831.6, 237.8 829.4 C 222.1 822.8, 218.4 820.1, 220.8 817.4 C 221.3 816.9, 223.3 812.4, 225.4 807.5 C 227.5 802.5, 229.6 798.0, 230.1 797.5 C 230.5 797.0, 231 796.0, 231 795.2 C 231 794.5, 232.1 791.6, 233.5 788.7 C 234.9 785.8, 239.2 776.0, 243.1 767 C 247.0 757.9, 251.5 747.8, 253.0 744.5 C 259.8 729.8, 261.9 724.7, 261.4 723.8 C 260.5 722.5, 249.3 722.8, 248.2 724.2 C 247.6 724.9, 245.3 729.9, 243.0 735.4 C 240.7 740.8, 238.4 746.0, 238.0 746.9 C 234.4 754.3, 231 762.2, 231 763.0 C 231 763.5, 229.6 766.8, 228.0 770.2 C 226.4 773.6, 223.4 780.3, 221.4 785 C 219.4 789.6, 217.0 795.3, 216.0 797.5 C 215.0 799.7, 206.2 820.1, 196.5 843 C 186.7 865.8, 178.4 884.9, 178.0 885.5 C 177.6 886.0, 176.4 888.6, 175.5 891.2 C 174.5 893.8, 173.2 896, 172.5 896 C 171.4 896, 165 882.8, 165 880.6 C 165 879.9, 164.3 878.5, 163.6 877.4 C 162.9 876.3, 161.3 872.8, 160.1 869.5 C 158.8 866.3, 156.8 861.3, 155.5 858.5 C 154.3 855.7, 142.1 827.4, 128.5 795.5 C 114.9 763.6, 102.4 734.2, 100.7 730.2 L 97.6 723 67.3 723 C 49.6 723, 37 723.3, 37 723.9 M 326.4 724.2 C 326.2 724.9, 326.1 780.1, 326.2 847 L 326.5 968.5 353.6 968.7 C 375.6 968.9, 380.9 968.7, 381.8 967.6 C 382.7 966.6, 382.9 934.5, 382.7 844.8 L 382.5 723.5 354.7 723.2 C 333.0 723.0, 326.8 723.2, 326.4 724.2 M 413.6 723.6 C 413.0 724.2, 412.6 767.6, 413.2 768.2 C 413.3 768.3, 431.0 768.6, 452.5 768.9 L 491.5 769.5 492 869 L 492.5 968.5 520.5 968.5 L 548.5 968.5 549 869 L 549.5 769.5 587.4 769.2 C 608.3 769.0, 625.8 768.5, 626.3 768.0 C 626.9 767.4, 627.4 736.4, 627.0 723.7 C 626.9 722.8, 414.5 722.7, 413.6 723.6 M 658.4 724.2 C 658.2 724.9, 658.1 780.1, 658.2 847 L 658.5 968.5 686.5 968.5 L 714.5 968.5 714.7 935.5 C 714.9 913.3, 715.3 902.2, 716.1 901.3 C 717.0 900.2, 722.5 900, 742.0 900 L 766.8 900 769.1 902.8 C 770.4 904.4, 776.6 913.2, 783 922.4 C 789.3 931.6, 796.5 941.9, 799 945.4 C 801.4 948.9, 805.9 955.3, 808.9 959.6 C 811.9 963.9, 814.9 967.8, 815.4 968.2 C 817.1 969.4, 875 969.1, 875 967.9 C 875 967.4, 867.7 956.5, 858.8 943.7 C 849.9 930.9, 837.9 913.8, 832.3 905.6 C 826.6 897.5, 822 890.5, 822 890.0 C 822 889.5, 824.3 887.9, 827.2 886.4 C 864.4 867.0, 880.3 826.2, 867.4 783.5 C 858.1 752.8, 831.2 731.8, 792.5 724.9 C 778.7 722.5, 659.3 721.8, 658.4 724.2 M 1021.9 767.9 C 998.6 771.7, 978.6 786.9, 967.1 809.6 C 956.7 830.2, 957.1 861.5, 967.9 883.2 C 980.9 909.2, 1005.8 924.0, 1036.6 923.9 C 1081.8 923.9, 1112.9 891.9, 1112.9 845.5 C 1112.9 808.5, 1092.9 780.2, 1059.5 770.0 C 1051.5 767.5, 1031.3 766.4, 1021.9 767.9 M 715.6 770.5 C 715.2 771.4, 715 790.5, 715 812.9 C 715 849.2, 715.1 853.8, 716.5 854.3 C 720.8 856.0, 769.5 854.9, 778.7 853.0 C 794.7 849.7, 804.4 842.8, 810.6 830.1 C 814.6 821.9, 814.7 802.4, 810.8 793.9 C 804.7 780.7, 793.3 772.9, 775.9 770.0 C 764.7 768.2, 716.3 768.6, 715.6 770.5");
  const LW = 1206, LH = 1008, LCX = LW / 2, LCY = LH / 2;
  const CONTENT_W = 1134;                 // ancho útil del lockup (sin márgenes)
  const OX = 1035.9, OY = 845.2, OR = 77; // centro y radio del hueco de la "O"

  // Línea de tiempo (ms) — súbele/bájale a estos números para acelerar o frenar
  const T_BUILD = 1400, T_HOLD = 1000, T_PAN = 1400, T_ZOOM = 1900;
  const T_PAN0 = T_BUILD + T_HOLD, T_ZOOM0 = T_PAN0 + T_PAN;
  const T_MSG0 = T_ZOOM0 + Math.round(T_ZOOM * 0.8), T_END = T_MSG0 + 3300;

  const off = document.createElement("canvas");
  off.width = COLS; off.height = ROWS;
  const octx = off.getContext("2d", { willReadFrequently: true });

  let overlay, cv, vctx, raf = 0, active = false, A = 0.6, FS = 12, DPR = 1, MSG = [];

  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = t => Math.max(0, Math.min(1, t));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutBack = t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
  const noise = (t, k) => Math.sin(t * 0.013 * k + k * 7.1) * Math.sin(t * 0.0071 * k + k * 3.3);

  // Cámara: posición, zoom, giro (roll), ondulación de filas y glitch según el momento
  function camera(t) {
    const viewW = COLS * A, viewH = ROWS;
    const s0 = Math.min((0.9 * viewW) / CONTENT_W, (0.9 * viewH) / (LH - 72));
    const sPan = s0 * 1.7;
    const sEnd = (1.8 * Math.hypot(viewW / 2, viewH / 2)) / OR;
    let cx = LCX, cy = LCY, s = s0, th = 0, wave = 0, glitch = 0, shake = 0;
    if (t < T_BUILD) {                                        // el logo entra girando y se acomoda
      const e = easeOut(t / T_BUILD), r = (1 - e) * (1 - e);
      s = s0 * (1 + 0.55 * r); th = -0.55 * r; glitch = 0.1 + 0.35 * (1 - e); wave = 0.8 * (1 - e);
    } else if (t < T_PAN0) {                                  // rebote + ondulación
      const k = t - T_BUILD, d = Math.exp(-k / 520);
      s = s0 * (1 + 0.06 * Math.sin(k / 72) * d); th = 0.07 * Math.sin(k / 95) * d;
      wave = 1.6 * Math.min(1, k / 500); glitch = k < 250 ? 0.25 : 0;
    } else if (t < T_ZOOM0) {                                 // recorrido derecha → izquierda con inclinación
      const u = easeInOut((t - T_PAN0) / T_PAN);
      cx = lerp(LCX, OX, u); cy = lerp(LCY, OY, u); s = lerp(s0, sPan, u);
      th = 0.30 * Math.sin(Math.PI * u); wave = 0.6 + 2.2 * (1 - u); shake = 0.35 * Math.sin(Math.PI * u);
      glitch = u < 0.08 ? 0.3 : 0;
    } else {                                                  // zoom en espiral al interior de la "O"
      const k = clamp01((t - T_ZOOM0) / T_ZOOM), u = Math.pow(k, 2.1);
      cx = OX; cy = OY; s = Math.exp(lerp(Math.log(sPan), Math.log(sEnd), u));
      th = 1.8 * u; wave = 0.6 * (1 - k); shake = 0.2 + 1.4 * u;
    }
    if (shake) { cx += (noise(t, 1) * shake) / s; cy += (noise(t, 2.3) * shake) / s; }
    return { cx, cy, s, th, wave, glitch };
  }

  function layoutMsg() {
    const viewW = COLS * A, viewH = ROWS, maxW = viewW * 0.9;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.font = "900 100px " + SANS;
    const wEm = txt => octx.measureText(txt).width / 100;
    const L1 = ["GRACIAS POR", "CONFIAR"], L2 = ["INGENIERÍA", "APLICADA A", "LA MEDICINA"];
    let E1 = Math.min(maxW / Math.max(...L1.map(wEm)), viewH * 0.2);
    let E2 = Math.min(maxW / Math.max(...L2.map(wEm)), E1 * 0.75);
    const H1 = 1.12, H2 = 1.2;
    let total = L1.length * E1 * H1 + E1 * 0.5 + L2.length * E2 * H2;
    if (total > viewH * 0.86) { const k = (viewH * 0.86) / total; E1 *= k; E2 *= k; total *= k; }
    let y = -total / 2; MSG = [];
    L1.forEach(tx => { MSG.push({ tx, em: E1, y: y + (E1 * H1) / 2 }); y += E1 * H1; });
    y += E1 * 0.5;
    L2.forEach(tx => { MSG.push({ tx, em: E2, y: y + (E2 * H2) / 2 }); y += E2 * H2; });
  }

  function render(t) {
    const viewW = COLS * A;
    const { cx, cy, s, th, wave, glitch } = camera(t);
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.fillStyle = "#000"; octx.fillRect(0, 0, COLS, ROWS);

    // Escena 1: logo con cámara (zoom + giro)
    const c = Math.cos(th), sn = Math.sin(th);
    octx.setTransform((s * c) / A, s * sn, (-s * sn) / A, s * c,
      (viewW / 2 - s * c * cx + s * sn * cy) / A, ROWS / 2 - s * sn * cx - s * c * cy);
    octx.fillStyle = "#fff"; octx.fill(LOGO, "evenodd");

    // Escena 2: mensaje en texto que sale "de adentro" de la O, con rebote y giro
    let wv = wave, gl = glitch, msgK = -1;
    if (t >= T_MSG0) {
      const k = t - T_MSG0; msgK = k;
      const e = clamp01(k / 1000);
      let m = 1 + 6 * (1 - easeOutBack(e)), mth = 1.8 * (1 - easeOut(e));
      m *= 1 + 0.012 * Math.sin(k / 260); mth += 0.02 * Math.sin(k / 400);
      const mc = Math.cos(mth), ms = Math.sin(mth);
      octx.setTransform((m * mc) / A, m * ms, (-m * ms) / A, m * mc, viewW / (2 * A), ROWS / 2);
      octx.fillStyle = "#fff"; octx.textAlign = "center"; octx.textBaseline = "middle";
      MSG.forEach(l => { octx.font = "900 " + l.em + "px " + SANS; octx.fillText(l.tx, 0, l.y); });
      wv = 0.3 + 0.7 * (1 - clamp01(k / 1000)); gl = k < 500 ? 0.4 * (1 - k / 500) : 0.03;
    }
    const px = octx.getImageData(0, 0, COLS, ROWS).data;

    const build = t < T_BUILD + 200 ? easeOut(clamp01(t / T_BUILD)) * 1.12 : 2;
    const msgP = msgK >= 0 && msgK < 700 ? easeOut(msgK / 700) * 1.12 : 2;
    const sweep = ((t / 9) % (COLS + 30)) - 15;
    const slot = Math.floor(t / 70);
    const rows = [];
    for (let j = 0; j < ROWS; j++) {
      let shift = Math.round(Math.sin(j * 0.32 + t / 130) * wv);
      if (gl > 0 && hash(j, slot) < gl * 0.25) shift += Math.round((hash(j + 9, slot) - 0.5) * 28 * gl);
      let line = "";
      for (let i = 0; i < COLS; i++) {
        const ii = i - shift;
        if (ii < 0 || ii >= COLS) { line += " "; continue; }
        let v = px[(j * COLS + ii) * 4] / 255;
        if (v < 0.05) { line += " "; continue; }
        const prog = msgK >= 0 ? msgP : build;
        if (prog < 2) {
          const th2 = (j / ROWS) * 0.4 + hash(ii, j) * 0.6;
          if (th2 > prog + 0.10) { line += " "; continue; }
          if (th2 > prog) { line += GLITCH[(Math.random() * GLITCH.length) | 0]; continue; }
        }
        v = Math.min(1, v + 0.3 * v * Math.exp(-Math.pow((i - sweep) / 5, 2)));
        line += RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))];
      }
      rows.push(line);
    }

    // Degradado de color periódico que corre de lado a lado
    const W = cv.width / DPR, x0 = -((t / 2000) % 1) * W;
    vctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    vctx.clearRect(0, 0, W, cv.height / DPR);
    const g = vctx.createLinearGradient(x0, 0, x0 + 3 * W, 0), n = COLORS.length;
    for (let p = 0; p < 3; p++) COLORS.forEach((col, k) => g.addColorStop((p + k / n) / 3, col));
    g.addColorStop(1, COLORS[0]);
    vctx.fillStyle = g;
    vctx.font = "bold " + FS + "px " + MONO;
    vctx.textBaseline = "top";
    for (let j = 0; j < ROWS; j++) vctx.fillText(rows[j], 0, j * FS);
  }

  function fit() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    vctx.font = "bold 100px " + MONO;
    A = vctx.measureText("@").width / 100 || 0.6;
    ROWS = Math.max(50, Math.min(84, Math.round((COLS * A * innerHeight) / innerWidth)));
    off.width = COLS; off.height = ROWS;
    FS = Math.min((innerWidth * 0.98) / (COLS * A), (innerHeight * 0.96) / ROWS);
    const w = COLS * A * FS, h = ROWS * FS;
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    cv.style.width = w + "px"; cv.style.height = h + "px";
    layoutMsg();
  }

  function open() {
    overlay = document.createElement("div");
    overlay.setAttribute("role", "img");
    overlay.setAttribute("aria-label", "VITRO. Gracias por confiar. Ingeniería aplicada a la medicina.");
    overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:#fff;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s ease;cursor:pointer;overflow:hidden;";
    cv = document.createElement("canvas");
    vctx = cv.getContext("2d");
    overlay.appendChild(cv);
    document.body.appendChild(overlay);
    fit(); addEventListener("resize", fit);
    requestAnimationFrame(() => (overlay.style.opacity = "1"));
    active = true;
  }

  function play({ onDone } = {}) {
    if (active) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { onDone && onDone(); return; }
    open();
    const t0 = performance.now(); let done = false;
    const finish = () => {
      if (done) return; done = true; active = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit); removeEventListener("keydown", onKey);
      overlay.style.opacity = "0";
      setTimeout(() => { overlay.remove(); onDone && onDone(); }, 260);
    };
    const onKey = e => { if (e.key === "Escape") finish(); };
    overlay.addEventListener("click", finish);
    addEventListener("keydown", onKey);

    const tick = now => {
      if (!active) return;
      const t = now - t0;
      render(Math.min(t, T_END));
      if (t >= T_END) { finish(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function attachEasterEgg(el, taps = 3, windowMs = 900) {
    let n = 0, timer;
    el.addEventListener("click", () => {
      n++; clearTimeout(timer);
      timer = setTimeout(() => (n = 0), windowMs);
      if (n >= taps) { n = 0; play(); }
    });
  }

  return { play, attachEasterEgg };
})();
