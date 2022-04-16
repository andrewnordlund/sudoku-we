let newPuzzleBtn, optionsBtn = null;

newPuzzleBtn = document.getElementById("newPuzzleBtn");
optionsBtn = document.getElementById("optionsBtn");
if (newPuzzleBtn) {
	console.log ("Got new puzzle button.");
} else {
	console.log ("Didn't get new puzzle button.");
}

if (optionsBtn) {
	optionsBtn.addEventListener("click", openOptionsPage, false);
} else {
}

function openOptionsPage () {
	browser.runtime.openOptionsPage();
} // end of openOptionsPage
