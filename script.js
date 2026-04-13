const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    levels = calcularLevels(); // recalcula níveis proporcional à tela
});

const MAX_ESTRELAS = 200;
const stars = [];
const connections = []; // Armazena linhas permanentes
const centerX = () => canvas.width / 2;
const centerY = () => canvas.height / 2;

// Camadas definidas por tamanho, velocidade e delay de criação
const layers = [
    { name: 'proxima', sizeRange: [2.5, 4], speedRange: [0.25, 0.6], delay: 600 },
    { name: 'media',   sizeRange: [1.5, 3], speedRange: [0.15, 0.4], delay: 300 },
    { name: 'distante',sizeRange: [1, 2], speedRange: [0.1, 0.25], delay: 200 }
];

// Níveis para linhas baseados na distância do centro
function calcularLevels() {
    const maxDist = Math.min(canvas.width, canvas.height) / 2;

    // fator proporcional ao tamanho da tela
    const baseArea = 1920 * 1080; // referência: tela full HD
    const currentArea = canvas.width * canvas.height;
    const scaleFactor = Math.sqrt(currentArea / baseArea);

    // função para limitar valores
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    return [
        { name: 'nivel1', minDist: 0, maxDist: maxDist/3,
          maxLines: Math.round(clamp(15 * scaleFactor, 2, 15)),
          maxLineDistance: clamp(50 * scaleFactor, 0, 50),
          currentLines: 0 },

        { name: 'nivel2', minDist: maxDist/3, maxDist: 2*maxDist/3,
          maxLines: Math.round(clamp(15 * scaleFactor, 3, 15)),
          maxLineDistance: clamp(90 * scaleFactor, 0, 90),
          currentLines: 0 },

        { name: 'nivel3', minDist: 2*maxDist/3, maxDist: maxDist,
          maxLines: Math.round(clamp(20 * scaleFactor, 4, 20)),
          maxLineDistance: clamp(140 * scaleFactor, 0, 140),
          currentLines: 0 },

        { name: 'nivel4', minDist: maxDist, maxDist: maxDist*1.4,
          maxLines: Math.round(clamp(12 * scaleFactor, 2, 12)),
          maxLineDistance: clamp(170 * scaleFactor, 0, 170),
          currentLines: 0 },

        { name: 'nivel5', minDist: maxDist*1.4, maxDist: maxDist*1.7,
          maxLines: Math.round(clamp(5 * scaleFactor, 1, 5)),
          maxLineDistance: clamp(190 * scaleFactor, 0, 190),
          currentLines: 0 },

        { name: 'nivel6', minDist: maxDist*1.7, maxDist: maxDist*3,
          maxLines: Math.round(clamp(4 * scaleFactor, 1, 4)),
          maxLineDistance: clamp(210 * scaleFactor, 0, 210),
          currentLines: 0 }
    ];
}

let levels = calcularLevels();

function aleatorio(min, max) { return Math.random() * (max - min) + min; }

function corAleatoria() {
    const cores = [
        { hue: 0, lightness: aleatorio(90, 100) },      
        { hue: aleatorio(40, 60), lightness: aleatorio(85, 100) }, 
        { hue: aleatorio(180, 220), lightness: aleatorio(70, 90) } 
    ];
    return cores[Math.floor(Math.random() * cores.length)];
}

function criarStar(camada) {
    if (stars.length >= MAX_ESTRELAS) return;

    const cor = corAleatoria();
    const angulo = aleatorio(0, 2 * Math.PI);
    const radius = aleatorio(camada.sizeRange[0], camada.sizeRange[1]);
    const speed = aleatorio(camada.speedRange[0], camada.speedRange[1]);

    stars.push({
        x: centerX(),
        y: centerY(),
        radius,
        alpha: 0, // começa transparente
        hue: cor.hue,
        lightness: cor.lightness,
        angulo,
        velocidade: speed,
        camada: camada.name,
        layerObj: camada,
        connections: 0
    });
}

// Criação de estrelas por camada com delay individual
for (const camada of layers) {
    setInterval(() => criarStar(camada), camada.delay);
}

function drawStar(star) {
    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius*3);
    gradient.addColorStop(0, `hsla(${star.hue},100%,${star.lightness}%,${0.5*star.alpha})`);
    gradient.addColorStop(0.5, `hsla(${star.hue},100%,${star.lightness}%,${0.15*star.alpha})`);
    gradient.addColorStop(1, 'hsla(0,0%,0%,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius*3, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = `hsla(${star.hue},100%,${star.lightness}%,${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI*2);
    ctx.fill();
}

function updateStars() {
    const maxDist = Math.min(canvas.width, canvas.height) / 2;

    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        const dx = star.x - centerX();
        const dy = star.y - centerY();
        const distanciaCentro = Math.sqrt(dx*dx + dy*dy);
        const fator = 1 + distanciaCentro / maxDist;

        star.x += Math.cos(star.angulo) * star.velocidade * fator;
        star.y += Math.sin(star.angulo) * star.velocidade * fator;

        star.alpha = Math.min(1, distanciaCentro / maxDist);
        star.radius = star.layerObj.sizeRange[0] +
                      (star.layerObj.sizeRange[1] - star.layerObj.sizeRange[0]) * Math.min(1, distanciaCentro / maxDist);

        // Se a estrela saiu da tela, removemos também suas conexões
        if (star.x < -star.radius*3 || star.x > canvas.width + star.radius*3 ||
            star.y < -star.radius*3 || star.y > canvas.height + star.radius*3) {

            // Remove todas as conexões ligadas a essa estrela
            for (let k = connections.length - 1; k >= 0; k--) {
                const c = connections[k];
                if (c.a === star || c.b === star) {
                    connections.splice(k, 1);
                    // decrementa contador de conexões da outra estrela
                    if (c.a !== star) c.a.connections = Math.max(0, c.a.connections - 1);
                    if (c.b !== star) c.b.connections = Math.max(0, c.b.connections - 1);
                }
            }

            // finalmente remove a estrela
            stars.splice(i, 1);
        }
    }
}


// Atualiza as linhas das constelações
// Atualiza as linhas das constelações
function updateConnections() {
    for (let i = 0; i < stars.length; i++) {
        const starA = stars[i];

        for (let j = i+1; j < stars.length; j++) {
            const starB = stars[j];
            if (starA.connections >= 2 || starB.connections >= 2) continue;

            const dx = starA.x - starB.x;
            const dy = starA.y - starB.y;
            const distAB = Math.sqrt(dx*dx + dy*dy);

            const distA = Math.sqrt((starA.x-centerX())**2 + (starA.y-centerY())**2);
            const distB = Math.sqrt((starB.x-centerX())**2 + (starB.y-centerY())**2);
            const avgDist = (distA + distB) / 2;

            const level = levels.find(l => avgDist >= l.minDist && avgDist <= l.maxDist);
            if (!level) continue;

            const linhasNoNivel = connections.filter(c => c.level === level.name).length;

            if (distAB <= level.maxLineDistance && linhasNoNivel < level.maxLines) {
                const existe = connections.some(c =>
                    (c.a === starA && c.b === starB) || (c.a === starB && c.b === starA)
                );
                if (!existe) {
                    // Nova conexão começa invisível
                    connections.push({a: starA, b: starB, level: level.name, alpha: 0});
                    starA.connections++;
                    starB.connections++;
                }
            }
        }
    }

    // Incrementa alpha das conexões (fade-in)
    for (let c of connections) {
        c.alpha = Math.min(1, c.alpha + 0.03); // velocidade do fade-in
    }

    // Remove linhas inválidas
    for (let k = connections.length -1; k >=0; k--) {
        const c = connections[k];
        const dx = c.a.x - c.b.x;
        const dy = c.a.y - c.b.y;
        const distAB = Math.sqrt(dx*dx + dy*dy);

        const dxA = c.a.x - centerX();
        const dyA = c.a.y - centerY();
        const distA = Math.sqrt(dxA*dxA + dyA*dyA);

        const dxB = c.b.x - centerX();
        const dyB = c.b.y - centerY();
        const distB = Math.sqrt(dxB*dxB + dyB*dyB);

        const avgDist = (distA + distB) / 2;
        const level = levels.find(l => l.name === c.level);

        if (!level || distAB > level.maxLineDistance || avgDist < level.minDist || avgDist > level.maxDist) {
            connections.splice(k,1);
            c.a.connections = Math.max(0, c.a.connections-1);
            c.b.connections = Math.max(0, c.b.connections-1);
        }
    }
}

function drawConnections() {
    for (const c of connections) {
        const dx = c.a.x - c.b.x;
        const dy = c.a.y - c.b.y;
        const distAB = Math.sqrt(dx*dx + dy*dy);

        const level = levels.find(l => l.name === c.level);
        if (!level) continue;
        if (distAB > level.maxLineDistance) continue;

        const alphaDist = 1 - Math.min(distAB / level.maxLineDistance, 1);
        const baseAlpha = alphaDist * (c.a.alpha + c.b.alpha) / 2;

        // aplica fade-in da conexão
        const finalAlpha = baseAlpha * c.alpha;

        if (finalAlpha > 0.01) {
            ctx.strokeStyle = `rgba(255,255,255,${finalAlpha})`;
            ctx.beginPath();
            ctx.moveTo(c.a.x, c.a.y);
            ctx.lineTo(c.b.x, c.b.y);
            ctx.stroke();
        }
    }
}

function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    updateStars();
    updateConnections();
    drawConnections();

    for (const star of stars) drawStar(star);

    requestAnimationFrame(animate);
}

animate();