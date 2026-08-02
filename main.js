// CyberGuard Password Strength Analyzer

const passwordInput = document.getElementById('password-input');
const toggleBtn = document.getElementById('toggle-visibility');
const eyeShow = document.getElementById('eye-show');
const eyeHide = document.getElementById('eye-hide');

const strengthText = document.getElementById('strength-text');
const scoreText = document.getElementById('score-text');
const segments = [
  document.getElementById('seg-1'),
  document.getElementById('seg-2'),
  document.getElementById('seg-3'),
  document.getElementById('seg-4')
];
const crackTimeDisplay = document.getElementById('crack-time');
const generateBtn = document.getElementById('generate-btn');

// Requirement Elements
const reqList = {
  length: document.getElementById('req-length'),
  lower: document.getElementById('req-lower'),
  upper: document.getElementById('req-upper'),
  number: document.getElementById('req-number'),
  symbol: document.getElementById('req-symbol')
};

// Patterns
const patterns = {
  lower: /[a-z]/,
  upper: /[A-Z]/,
  number: /[0-9]/,
  symbol: /[^a-zA-Z0-9]/
};

// Colors
const colors = {
  weak: 'var(--neon-red)',
  fair: 'var(--neon-yellow)',
  good: 'var(--neon-cyan)',
  strong: 'var(--neon-green)'
};

// Toggle Visibility
toggleBtn.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  if (type === 'text') {
    eyeShow.style.display = 'none';
    eyeHide.style.display = 'block';
  } else {
    eyeShow.style.display = 'block';
    eyeHide.style.display = 'none';
  }
});

// Analyze Password
passwordInput.addEventListener('input', (e) => {
  const pwd = e.target.value;
  analyzePassword(pwd);
});

function analyzePassword(pwd) {
  // Check Requirements
  const checks = {
    length: pwd.length >= 8,
    lower: patterns.lower.test(pwd),
    upper: patterns.upper.test(pwd),
    number: patterns.number.test(pwd),
    symbol: patterns.symbol.test(pwd)
  };

  // Update DOM for Requirements
  for (const [key, valid] of Object.entries(checks)) {
    if (valid) {
      reqList[key].classList.add('valid');
    } else {
      reqList[key].classList.remove('valid');
    }
  }

  if (pwd.length === 0) {
    resetUI();
    return;
  }

  // Calculate Entropy (H = L * log2(N))
  let poolSize = 0;
  if (checks.lower) poolSize += 26;
  if (checks.upper) poolSize += 26;
  if (checks.number) poolSize += 10;
  if (checks.symbol) poolSize += 32;

  const entropy = poolSize === 0 ? 0 : pwd.length * Math.log2(poolSize);
  
  // Scoring
  // Weak < 35, Fair < 60, Good < 80, Strong >= 80
  let score = 0;
  if (entropy > 0) score = Math.min(100, Math.round((entropy / 100) * 100)); // normalized roughly

  // Adjust score based on strict requirements (bonus/penalty)
  const reqCount = Object.values(checks).filter(Boolean).length;
  if (reqCount < 3 && score > 50) score = 50; // Cap if not enough variety
  if (reqCount === 5 && pwd.length >= 12) score = Math.max(score, 90);

  updateMeter(score, entropy);
}

function updateMeter(score, entropy) {
  scoreText.innerText = `${score}/100`;

  // Estimate Crack Time (Assuming 100 Billion guesses/sec - modern cracking rig)
  const guessesPerSecond = 100e9;
  const totalCombinations = Math.pow(2, entropy);
  const secondsToCrack = totalCombinations / guessesPerSecond;
  
  crackTimeDisplay.innerText = formatTime(secondsToCrack);

  let activeSegments = 0;
  let color = colors.weak;
  let text = "Weak";

  if (score >= 80) {
    activeSegments = 4;
    color = colors.strong;
    text = "Unbreakable";
  } else if (score >= 60) {
    activeSegments = 3;
    color = colors.good;
    text = "Strong";
  } else if (score >= 35) {
    activeSegments = 2;
    color = colors.fair;
    text = "Fair";
  } else {
    activeSegments = 1;
    color = colors.weak;
    text = "Weak";
  }

  strengthText.innerText = text;
  strengthText.style.color = color;

  segments.forEach((seg, index) => {
    if (index < activeSegments) {
      seg.style.background = color;
      seg.style.boxShadow = `0 0 10px ${color}`;
    } else {
      seg.style.background = 'rgba(255, 255, 255, 0.1)';
      seg.style.boxShadow = 'inset 0 0 5px rgba(0,0,0,0.5)';
    }
  });
}

function resetUI() {
  scoreText.innerText = `0/100`;
  strengthText.innerText = "Awaiting Input...";
  strengthText.style.color = 'var(--text-muted)';
  crackTimeDisplay.innerText = "Instant";
  
  segments.forEach(seg => {
    seg.style.background = 'rgba(255, 255, 255, 0.1)';
    seg.style.boxShadow = 'inset 0 0 5px rgba(0,0,0,0.5)';
  });
}

function formatTime(seconds) {
  if (seconds < 1) return "Instant";
  if (seconds < 60) return `${Math.round(seconds)} Seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} Minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} Hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} Days`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} Years`;
  return `${Math.round(seconds / 3153600000)} Centuries`;
}

// Generate Secure Password
generateBtn.addEventListener('click', () => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  const length = 16;
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  
  // Ensure all requirements are met by injecting randomly if missing
  if (!patterns.lower.test(retVal)) retVal = replaceAt(retVal, 0, 'a');
  if (!patterns.upper.test(retVal)) retVal = replaceAt(retVal, 1, 'A');
  if (!patterns.number.test(retVal)) retVal = replaceAt(retVal, 2, '1');
  if (!patterns.symbol.test(retVal)) retVal = replaceAt(retVal, 3, '@');
  
  // Shuffle string
  retVal = retVal.split('').sort(() => 0.5 - Math.random()).join('');

  passwordInput.value = retVal;
  analyzePassword(retVal);
  
  // Optional: Visual Feedback on Button
  const originalText = generateBtn.innerHTML;
  generateBtn.innerHTML = `Generated! <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  generateBtn.style.borderColor = 'var(--neon-green)';
  generateBtn.style.color = 'var(--neon-green)';
  
  setTimeout(() => {
    generateBtn.innerHTML = originalText;
    generateBtn.style.borderColor = 'var(--neon-purple)';
    generateBtn.style.color = '#fff';
  }, 1500);
});

function replaceAt(str, index, replacement) {
    return str.substring(0, index) + replacement + str.substring(index + 1);
}
