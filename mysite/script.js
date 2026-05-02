// Simple interactive logic for the exploration site
(() => {
	// Sample problems (for beginners): each has two items A/B and a truth label
					// Use the actual photos copied into assets so the page shows the user's images.
					const samples = [
						{
							A: { type: 'real', media: 'assets/ai1.jpg', explain: '사람이 찍은 사진' },
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

		// --- Trust visualization (probabilistic model) ---
		function computeTrusts() {
				// Simple probabilistic model parameters (tunable)
				// allow sliders to override defaults
				const sliderAi = document.getElementById('sliderAi');
				const sliderHuman = document.getElementById('sliderHuman');
				const pAI = sliderAi ? (parseInt(sliderAi.value,10)/100) : 0.72; // AI base accuracy
				const pHumanCorrect = sliderHuman ? (parseInt(sliderHuman.value,10)/100) : 0.9; // human verifier

			// AI-only trust = AI accuracy
			const aiOnly = pAI;
			// Human-verified trust: AI correct OR (AI wrong AND human correct)
			const humanVerified = pAI + (1 - pAI) * pHumanCorrect;
			return { aiOnly, humanVerified, pAI, pHumanCorrect };
		}

		function renderTrustGraph() {
			const svg = document.getElementById('trustGraph');
			if (!svg) return;
			const w = 260, h = 80; // drawing area inside viewBox
			const pad = 20;
			const { aiOnly, humanVerified, pAI, pHumanCorrect } = computeTrusts();
			// scale to width
			const barMax = w;
			const aiW = Math.round(aiOnly * barMax);
			const humanW = Math.round(humanVerified * barMax);
			// build simple svg content
			const content = `
				<rect x="${pad}" y="10" width="${barMax}" height="18" fill="#f1f5f9" rx="6" />
				<rect x="${pad}" y="10" width="${aiW}" height="18" fill="#60a5fa" rx="6" />
				<text x="${pad + barMax + 8}" y="24" font-size="12" fill="#0f172a">AI-only ${(aiOnly*100).toFixed(0)}%</text>

				<rect x="${pad}" y="40" width="${barMax}" height="18" fill="#f1f5f9" rx="6" />
				<rect x="${pad}" y="40" width="${humanW}" height="18" fill="#06b6d4" rx="6" />
				<text x="${pad + barMax + 8}" y="54" font-size="12" fill="#0f172a">Human-verified ${(humanVerified*100).toFixed(0)}%</text>
			`;
			svg.setAttribute('viewBox', `0 0 ${w+pad*2+80} ${h}`);
			// animate by setting width from 0 to target
			svg.innerHTML = content;
			// explanation text
			const expl = document.getElementById('trustExplain');
			if (expl) {
				expl.innerHTML = `모델: AI 단독 정확도 = ${(pAI*100).toFixed(0)}%; 인간 검증 정확도 = ${(pHumanCorrect*100).toFixed(0)}%. 인간이 잘못된 AI 결과를 교정할 확률을 반영해 신뢰도가 높아집니다.`;
			}
		}

		// draw initial graph
		renderTrustGraph();

			// Simulation controls
			const runSimBtn = document.getElementById('runSim');
			const runRoundsBtn = document.getElementById('runRounds');
			const simStats = document.getElementById('simStats');

			function runSim() {
				renderTrustGraph();
				if (simStats) simStats.textContent = '시뮬레이션 완료: 그래프가 업데이트되었습니다.';
			}

			function runRounds() {
				const rounds = 1000;
				const { pAI, pHumanCorrect } = computeTrusts();
				let correctAfterHuman = 0;
				for (let i=0;i<rounds;i++){
					const aiCorrect = Math.random() < pAI;
					if (aiCorrect) correctAfterHuman++;
					else {
						// AI wrong, human may correct
						if (Math.random() < pHumanCorrect) correctAfterHuman++;
					}
				}
				const percent = (correctAfterHuman/rounds*100).toFixed(1);
				if (simStats) simStats.textContent = `${rounds}회 시뮬레이션 결과: 인간 검증 후 정확도 ${percent}%`;
				renderTrustGraph();
			}

			if (runSimBtn) runSimBtn.addEventListener('click', runSim);
			if (runRoundsBtn) runRoundsBtn.addEventListener('click', runRounds);

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
