// Simple interactive logic for the exploration site
(() => {
	// Sample problems (for beginners): each has two items A/B and a truth label
					// Use the actual photos copied into assets so the page shows the user's images.
					const samples = [
						{
							A: { type: 'real', media: 'assets/ai1.png', explain: '사람이 찍은 사진' },
							B: { type: 'ai', media: 'assets/real1.png', explain: 'AI가 만든 사진' }
						}
					];

	let sampleIndex = 0;
	let userChoice = { A: null, B: null };

	// Elements
	const mediaA = document.getElementById('mediaA');
	const mediaB = document.getElementById('mediaB');
	const explainA = document.getElementById('explainA');
	const explainB = document.getElementById('explainB');
	const revealCompare = document.getElementById('revealCompare');
	const nextCompare = document.getElementById('nextCompare');

	// HITL elements
	const aiDecision = document.getElementById('aiDecision');
	const forceWrong = document.getElementById('forceWrong');
	const userReal = document.getElementById('userReal');
	const userAi = document.getElementById('userAi');
	const finalResult = document.getElementById('finalResult');
	const trustAi = document.getElementById('trustAi');
	const trustHuman = document.getElementById('trustHuman');

	function loadSample(i) {
		const s = samples[i % samples.length];
			// render media: if AI and media points to an svg path, show image; else show text
				function renderMedia(el, item) {
					if (typeof item.media === 'string') {
						const lower = item.media.toLowerCase();
						if (lower.endsWith('.svg') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
							el.innerHTML = `<img src="${item.media}" alt="media">`;
							return;
						}
						el.textContent = item.media;
						return;
					}
					el.textContent = String(item.media);
				}

				renderMedia(mediaA, s.A);
				renderMedia(mediaB, s.B);
		explainA.textContent = '';
		explainB.textContent = '';
		userChoice = { A: null, B: null };
		// Reset HITL
		aiDecision.textContent = 'AI: 판단 대기 중...';
		finalResult.textContent = '-';
		trustAi.textContent = '40%';
		trustHuman.textContent = '80%';
	}

	function revealCurrent() {
		const s = samples[sampleIndex % samples.length];
		// show explainers and correct labels
		explainA.textContent = `정답: ${s.A.type.toUpperCase()} — 이유: ${s.A.explain}`;
		explainB.textContent = `정답: ${s.B.type.toUpperCase()} — 이유: ${s.B.explain}`;
	}

		// user chooses A/B and toggle active state
		document.querySelectorAll('.choose').forEach(btn => {
			btn.addEventListener('click', e => {
				const target = btn.dataset.target;
				const choice = btn.dataset.choice; // 'real' or 'ai'
				userChoice[target] = choice;
				const elExplain = target === 'A' ? explainA : explainB;
				elExplain.textContent = `사용자 선택: ${choice}`;
				// toggle active class for this target group
				document.querySelectorAll(`.choose[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
			});
		});

	revealCompare.addEventListener('click', () => {
		revealCurrent();
	});

		// nextCompare button removed - no-op

	// --- HITL flow ---
	function runAiDecision() {
		const s = samples[sampleIndex % samples.length];
		// AI reports s.A.type for item A (simple demo)
		let aiSays = `AI: 항목 A는 ${s.A.type.toUpperCase()} 입니다.`;
		// If forceWrong is checked, flip the AI answer
		if (forceWrong.checked) {
			const flipped = s.A.type === 'ai' ? 'REAL' : 'AI';
			aiSays = `AI(오류 시뮬레이션): 항목 A는 ${flipped} 입니다.`;
		}
		aiDecision.textContent = aiSays;
	}

	// user decision buttons
	userReal.addEventListener('click', () => applyHumanDecision('real'));
	userAi.addEventListener('click', () => applyHumanDecision('ai'));

	function applyHumanDecision(choice) {
		// apply human decision and show final verification
		const s = samples[sampleIndex % samples.length];
		// Simple rule: if human disagrees with AI and human is assumed correct -> final follows human
		const humanText = `사용자: 항목 A는 ${choice.toUpperCase()} 로 판단`;
		finalResult.textContent = humanText;
		// Update trust numbers: AI alone lower, human verified higher
		// If forceWrong was on and human corrected it, show bigger trust uplift
		if (forceWrong.checked && choice === s.A.type) {
			// human corrected AI
			trustAi.textContent = '25%';
			trustHuman.textContent = '90%';
		} else {
			trustAi.textContent = '45%';
			trustHuman.textContent = '80%';
		}
	}

		// --- Use compare-card as quiz: score computed on revealCompare click ---
		const scoreArea = document.getElementById('scoreArea');
		const verifyStrength = document.getElementById('verifyStrength');
		const verifyResult = document.getElementById('verifyResult');

		function computeCompareScore() {
			// samples contains A/B types and media; userChoice holds user's picks
			let correct = 0;
			const s = samples[sampleIndex % samples.length];
			['A','B'].forEach(k => {
				const user = userChoice[k];
				const truth = s[k].type; // 'ai' or 'real'
				if (user && user === truth) correct++;
			});
			const pct = Math.round((correct / 2) * 100);
			scoreArea.textContent = `판별 정확도: ${pct}% (${correct}/2)`;
		}

		function applyHumanVerification() {
			const strength = verifyStrength ? parseInt(verifyStrength.value,10) : 80;
			if (verifyResult) verifyResult.textContent = `검수 적용됨 — 인간 검수 가중치: ${strength}%`;
			setTimeout(()=>{
				if (verifyResult) verifyResult.textContent += ' — 출처 확인과 맥락 검토를 통해 신뢰도가 향상됩니다.';
			},400);
		}

		if (revealCompare) {
			revealCompare.addEventListener('click', () => {
				// compute score and then reveal original explanations
				computeCompareScore();
				revealCurrent();
			});
		}

		const applyVerifyBtn = document.getElementById('applyVerify');
		if (applyVerifyBtn) applyVerifyBtn.addEventListener('click', applyHumanVerification);

		// Trust graph rendering for HITL card
		function renderTrustGraph(aiPct, humanPct) {
			const svg = document.getElementById('trustGraph');
			if (!svg) return;
			const w = 260, h = 80, pad = 20;
			svg.setAttribute('viewBox', `0 0 ${w + pad*2 + 80} ${h}`);
			const aiW = Math.round((aiPct/100) * w);
			const humanW = Math.round((humanPct/100) * w);
			const content = `
				<rect x="${pad}" y="10" width="${w}" height="18" fill="#0f1724" rx="6" />
				<rect id="barAi" x="${pad}" y="10" width="0" height="18" class="trust-bar-ai" rx="6" />
				<text x="${pad + w + 8}" y="24" font-size="12" fill="#9aa5b1">AI-only ${Math.round(aiPct)}%</text>

				<rect x="${pad}" y="40" width="${w}" height="18" fill="#0f1724" rx="6" />
				<rect id="barHuman" x="${pad}" y="40" width="0" height="18" class="trust-bar-human" rx="6" />
				<text x="${pad + w + 8}" y="54" font-size="12" fill="#9aa5b1">Human-verified ${Math.round(humanPct)}%</text>
			`;
			svg.innerHTML = content;
			// animate widths smoothly
			const barAi = document.getElementById('barAi');
			const barHuman = document.getElementById('barHuman');
			if (barAi) {
				const anim = document.createElementNS('http://www.w3.org/2000/svg','animate');
				anim.setAttribute('attributeName','width');
				anim.setAttribute('from','0');
				anim.setAttribute('to',String(aiW));
				anim.setAttribute('dur','600ms');
				anim.setAttribute('fill','freeze');
				barAi.appendChild(anim);
				anim.beginElement();
			}
			if (barHuman) {
				const anim2 = document.createElementNS('http://www.w3.org/2000/svg','animate');
				anim2.setAttribute('attributeName','width');
				anim2.setAttribute('from','0');
				anim2.setAttribute('to',String(humanW));
				anim2.setAttribute('dur','600ms');
				anim2.setAttribute('fill','freeze');
				barHuman.appendChild(anim2);
				anim2.beginElement();
			}
		}

		// hook HITL apply button
		const hitlApply = document.getElementById('hitlApply');
		const hitlStrength = document.getElementById('hitlStrength');
		// initialize graph
		renderTrustGraph(40,80);
		// Simulation controls (analytic + Monte Carlo)
		const runSimBtn = document.getElementById('runSim');
		const simAi = document.getElementById('simAi');
		const simHuman = document.getElementById('simHuman');
		const simRounds = document.getElementById('simRounds');
		const simResult = document.getElementById('simResult');

		function runSimulation() {
			const pAI = simAi ? parseInt(simAi.value,10)/100 : 0.72;
			const pHuman = simHuman ? parseInt(simHuman.value,10)/100 : 0.9;
			const rounds = simRounds ? parseInt(simRounds.value,10) : 1000;
			// analytic
			const aiOnly = pAI;
			const humanVerifiedAnalytic = pAI + (1 - pAI) * pHuman;

			// monte carlo
			let correctAfterHuman = 0;
			for (let i=0;i<rounds;i++){
				const aiCorrect = Math.random() < pAI;
				if (aiCorrect) correctAfterHuman++;
				else {
					if (Math.random() < pHuman) correctAfterHuman++;
				}
			}
			const simPct = (correctAfterHuman/rounds*100).toFixed(2);
			// update graph (use percentages)
			renderTrustGraph(aiOnly*100, humanVerifiedAnalytic*100);
			if (simResult) simResult.textContent = `해석적(이론) 결과: ${Math.round(humanVerifiedAnalytic*100)}% — ${rounds}회 시뮬레이션 평균: ${simPct}%`;
		}

		if (runSimBtn) runSimBtn.addEventListener('click', runSimulation);

		// Batch simulation: run combinations of AI accuracies and human correction probabilities
		const runBatchSimBtn = document.getElementById('runBatchSim');
		const batchSimResult = document.getElementById('batchSimResult');

		function runBatchSimulation() {
			// fixed sets as requested
			const aiAccuracies = [0.6, 0.7, 0.8];
			const humanCorrections = [0.7, 0.8, 0.9];
			const rounds = simRounds ? parseInt(simRounds.value,10) : 10000;
			let out = [];
			out.push('AI\tHuman\tAnalytic%\tSimulated%');
			for (let ai of aiAccuracies) {
				for (let hum of humanCorrections) {
					const analytic = ai + (1 - ai) * hum;
					// monte carlo
					let correct = 0;
					for (let i=0;i<rounds;i++){
						if (Math.random() < ai) correct++;
						else if (Math.random() < hum) correct++;
					}
					const simPct = (correct / rounds * 100).toFixed(2);
					out.push(`${Math.round(ai*100)}%\t${Math.round(hum*100)}%\t${Math.round(analytic*100)}%\t${simPct}%`);
				}
			}
			if (batchSimResult) batchSimResult.textContent = out.join('\n');
			// show representative result on the trust graph (first analytic)
			if (aiAccuracies.length && humanCorrections.length) {
				const ai = aiAccuracies[0];
				const hum = humanCorrections[0];
				const analytic = ai + (1 - ai) * hum;
				renderTrustGraph(ai*100, analytic*100);
				if (trustAi) trustAi.textContent = `${Math.round(ai*100)}%`;
				if (trustHuman) trustHuman.textContent = `${Math.round(analytic*100)}%`;
			}
		}

		if (runBatchSimBtn) runBatchSimBtn.addEventListener('click', runBatchSimulation);

		// Per-pair calculator: reads numeric inputs and computes analytic + monte carlo
		const runPairBtn = document.getElementById('runPair');
		const pairAiInput = document.getElementById('pairAi');
		const pairHumanInput = document.getElementById('pairHuman');
		const simPairResult = document.getElementById('simPairResult');

		function runPairSimulation() {
			const aiPct = pairAiInput ? parseFloat(pairAiInput.value)/100 : 0.6;
			const humanPct = pairHumanInput ? parseFloat(pairHumanInput.value)/100 : 0.7;
			const rounds = simRounds ? parseInt(simRounds.value,10) : 1000;
			const analytic = aiPct + (1 - aiPct) * humanPct;
			let correct = 0;
			for (let i=0;i<rounds;i++){
				if (Math.random() < aiPct) correct++;
				else if (Math.random() < humanPct) correct++;
			}
			const simPct = (correct/rounds*100).toFixed(2);
			if (simPairResult) simPairResult.textContent = `Analytic: ${Math.round(analytic*100)}% — Simulated(${rounds}회): ${simPct}%`;
			// Update HITL result area (4-3)
			if (trustAi) trustAi.textContent = `${Math.round(aiPct*100)}%`;
			if (trustHuman) trustHuman.textContent = `${Math.round(analytic*100)}%`;
			renderTrustGraph(aiPct*100, analytic*100);
			if (finalResult) finalResult.textContent = `AI-only ${Math.round(aiPct*100)}% → Human-verified ${Math.round(analytic*100)}%`;
		}

		if (runPairBtn) runPairBtn.addEventListener('click', runPairSimulation);


			// Complete button: show only conclusion section
			const completeBtn = document.getElementById('completeBtn');
			if (completeBtn) {
				completeBtn.addEventListener('click', () => {
					// hide main content, show conclusion card only
					// hide main content, show conclusion card only
					document.querySelectorAll('main .card').forEach(c=>c.style.display='none');
					const concl = document.querySelector('.conclusion');
					if (concl) { concl.style.display='block'; concl.scrollIntoView({behavior:'smooth'}); }
				});
			}

			// Back button: restore main cards and hide conclusion
			const backBtn = document.getElementById('backBtn');
			if (backBtn) {
				backBtn.addEventListener('click', () => {
					document.querySelectorAll('main .card').forEach(c=>c.style.display='block');
					const concl = document.querySelector('.conclusion');
					if (concl) { concl.style.display='none'; }
					// scroll back to top of main content
					document.querySelector('main.container')?.scrollIntoView({behavior:'smooth'});
				});
			}

	// initial load
	loadSample(sampleIndex);
	// run AI decision after small delay so UI feels dynamic
	setTimeout(runAiDecision, 400);
	// also update AI decision if forceWrong toggled
	forceWrong.addEventListener('change', runAiDecision);

})();
