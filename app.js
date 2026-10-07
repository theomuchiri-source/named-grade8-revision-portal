(function() {
    const SUPABASE_URL = 'https://eslhplhtehecjexlpwbg.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_0LoIhz1IeizlkKVeQ_h2xg_1OrrQz2X';

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    document.addEventListener('DOMContentLoaded', () => {
        const authSection = document.getElementById('auth-section');
        const contentSection = document.getElementById('content-section');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const authStatus = document.getElementById('auth-status');

        const subjectsContainer = document.getElementById('subjects-container');
        const papersContainer = document.getElementById('papers-container');
        const topicsList = document.getElementById('topics-list');
        const quizContainer = document.getElementById('quiz-container');

        sb.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                onLoginSuccess(session.user);
            }
        });

        signupBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                authStatus.textContent = 'Please enter both your email and password.';
                return;
            }

            const { data, error } = await sb.auth.signUp({ email, password });
            if (error) {
                authStatus.textContent = error.message;
            } else {
                authStatus.textContent = 'Sign up successful! You can now log in.';
            }
        });

        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                authStatus.textContent = 'Please enter both your email and password.';
                return;
            }

            const { data, error } = await sb.auth.signInWithPassword({ email, password });
            if (error) {
                authStatus.textContent = error.message;
            } else {
                onLoginSuccess(data.user);
            }
        });

        function onLoginSuccess(user) {
            authSection.style.display = 'none';
            contentSection.style.display = 'block';
            
            const statusDisplay = document.getElementById('user-status-display');
            if (statusDisplay) {
                statusDisplay.textContent = `Signed in as: ${user.email}`;
            }
            
            loadSubjects();
        }

        window.switchPortalTab = function(tabName) {
            topicsList.innerHTML = '';
            quizContainer.innerHTML = '';

            if (tabName === 'subjects') {
                subjectsContainer.style.display = 'block';
                papersContainer.style.display = 'none';
                loadSubjects();
            } else if (tabName === 'papers' || tabName === 'tests') {
                subjectsContainer.style.display = 'none';
                papersContainer.style.display = 'block';
                loadKnecPapers(tabName === 'tests' ? 'Qualifying Test' : 'National Assessment');
            }
        };

        async function loadSubjects() {
            subjectsContainer.innerHTML = '<h3>Primary & Junior School Subjects</h3><div class="loading">Loading subjects from database...</div>';
            
            const { data: subjects, error } = await sb.from('subjects').select('*');
            
            if (error) {
                subjectsContainer.innerHTML = `<p style="color: red;">Error loading subjects: ${error.message}</p>`;
                return;
            }

            let html = '<h3>Primary & Junior School Subjects</h3><div class="grid-list">';
            subjects.forEach(subject => {
                html += `<button class="subject-card" onclick="loadTopics('${subject.id}', '${subject.name}')">📚 ${subject.name}</button>`;
            });
            html += '</div>';
            subjectsContainer.innerHTML = html;
        }

        async function loadKnecPapers(categoryFilter) {
            papersContainer.innerHTML = `<h3>Official KNEC Past Papers & ${categoryFilter}s</h3><div class="loading">Loading official papers...</div>`;
            
            const { data: papers, error } = await sb.from('knec_papers').select('*');
            
            if (error || !papers || papers.length === 0) {
                papersContainer.innerHTML = `
                    <h3>Official KNEC Past Papers & ${categoryFilter}s</h3>
                    <p style="color: #64748b; margin-bottom: 20px;">No paper bundles uploaded to database yet. You can use standard subject revision modules below.</p>
                    <button class="portal-sub-btn cyan" onclick="switchPortalTab('subjects')" style="max-width: 250px;">Go to Subject Revision</button>
                `;
                return;
            }

            let html = `<h3>Official KNEC Past Papers & ${categoryFilter}s</h3><div class="grid-list">`;
            papers.forEach(paper => {
                const fileLink = paper.file_url || '#';
                html += `<button class="paper-card" onclick="window.open('${fileLink}', '_blank')">📄 ${paper.title} (${paper.year})</button>`;
            });
            html += '</div>';
            papersContainer.innerHTML = html;
        }

        window.loadTopics = async function(subjectId, subjectName) {
            subjectsContainer.style.display = 'none';
            papersContainer.style.display = 'none';
            topicsList.innerHTML = `<button class="back-btn" onclick="switchPortalTab('subjects')">← Back to Subjects</button><h3>${subjectName} - Topics</h3><div class="loading">Loading topics...</div>`;

            const { data: topics, error } = await sb
                .from('topics')
                .select('*')
                .eq('subject_id', subjectId);

            if (error) {
                topicsList.innerHTML = `<p style="color: red;">Error loading topics: ${error.message}</p>`;
                return;
            }

            let html = `<button class="back-btn" onclick="switchPortalTab('subjects')">← Back to Subjects</button><h3>${subjectName} - Topics</h3><div class="grid-list">`;
            topics.forEach(topic => {
                html += `<button class="topic-card" onclick="loadQuiz('${topic.id}', '${topic.name}')">📝 ${topic.name}</button>`;
            });
            html += '</div>';
            topicsList.innerHTML = html;
        };

        window.loadQuiz = async function(topicId, topicName) {
            topicsList.style.display = 'none';
            quizContainer.innerHTML = `<button class="back-btn" onclick="switchPortalTab('subjects')">← Back</button><h3>Quiz: ${topicName}</h3><div class="loading">Loading assessment questions...</div>`;

            const { data: questions, error } = await sb
                .from('questions')
                .select('*')
                .eq('topic_id', topicId);

            if (error || !questions || questions.length === 0) {
                quizContainer.innerHTML = `<button class="back-btn" onclick="switchPortalTab('subjects')">← Back</button><h3>Quiz: ${topicName}</h3><p>No questions found for this topic yet.</p>`;
                return;
            }

            let html = `<button class="back-btn" onclick="switchPortalTab('subjects')">← Back</button><h3>Quiz: ${topicName}</h3><form id="quiz-form">`;
            questions.forEach((q, index) => {
                html += `
                    <div class="question-block">
                        <p><strong>Question ${index + 1}: ${q.question_text}</strong></p>
                        <label><input type="radio" name="q_${q.id}" value="${q.option_a}" required> ${q.option_a}</label>
                        <label><input type="radio" name="q_${q.id}" value="${q.option_b}"> ${q.option_b}</label>
                        <label><input type="radio" name="q_${q.id}" value="${q.option_c}"> ${q.option_c}</label>
                        <label><input type="radio" name="q_${q.id}" value="${q.option_d}"> ${q.option_d}</label>
                    </div>
                `;
            });
            html += `<button type="submit" class="submit-quiz-btn">Submit Assessment</button></form><div id="quiz-result" style="margin-top: 20px;"></div>`;
            quizContainer.innerHTML = html;

            document.getElementById('quiz-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                let score = 0;
                let total = questions.length;

                questions.forEach(q => {
                    const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
                    if (selected && selected.value.trim() === q.correct_answer.trim()) {
                        score++;
                    }
                });

                const resultDiv = document.getElementById('quiz-result');
                const percentage = Math.round((score / total) * 100);
                
                resultDiv.innerHTML = `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; text-align: center;">
                        <h3 style="color: #166534; margin-top: 0;">Assessment Completed!</h3>
                        <p style="font-size: 18px; font-weight: bold; color: #15803d;">Your Score: ${score} / ${total} (${percentage}%)</p>
                    </div>
                `;

                const { data: { user } } = await sb.auth.getUser();
                if (user) {
                    await sb.from('user_scores').insert([
                        { user_id: user.id, topic_id: topicId, score: score, total: total }
                    ]);
                    resultDiv.innerHTML += `<p style="color: #16a34a; font-weight: bold; text-align: center; margin-top: 10px;">✓ Score securely logged to your student profile!</p>`;
                }
            });
        };
    });
})();