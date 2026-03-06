// Company Orchestration Dashboard Component
'use strict';

document.addEventListener('alpine:init', function () {
    Alpine.data('companyPage', function () {
        return {
            loading: true,
            loadError: '',
            goals: [],
            issues: [],
            orgChart: [],
            budget: { allocated: 0, spent: 0, remaining: 0 },
            agentCount: 0,
            openIssueCount: 0,

            // Goal creation form
            showGoalForm: false,
            newGoal: { title: '', description: '', budget: 0 },

            // Issue creation form
            showIssueForm: false,
            newIssue: {
                goal_id: '',
                title: '',
                description: '',
                assigned_to: '',
                priority: 2,
                labels: '',
            },

            init() {
                this.loadCompanyData();
            },

            async loadCompanyData() {
                this.loading = true;
                this.loadError = '';
                try {
                    const resp = await ClawReformAPI.get('/api/company/overview');
                    this.goals = resp.goals || [];
                    this.issues = resp.issues || [];
                    this.orgChart = resp.org_chart || [];
                    this.budget = resp.budget || { allocated: 0, spent: 0, remaining: 0 };
                    this.agentCount = resp.agent_count || 0;
                    this.openIssueCount = resp.open_issue_count || 0;
                } catch (e) {
                    this.loadError = e.message || 'Failed to load company data';
                } finally {
                    this.loading = false;
                }
            },

            async createGoal() {
                if (!this.newGoal.title.trim()) return;
                try {
                    await ClawReformAPI.post('/api/company/goals', {
                        title: this.newGoal.title,
                        description: this.newGoal.description,
                        budget: parseFloat(this.newGoal.budget) || 0,
                    });
                    this.newGoal = { title: '', description: '', budget: 0 };
                    this.showGoalForm = false;
                    await this.loadCompanyData();
                } catch (e) {
                    this.loadError = e.message || 'Failed to create goal';
                }
            },

            async createIssue() {
                if (!this.newIssue.title.trim()) return;
                try {
                    await ClawReformAPI.post('/api/company/issues', {
                        goal_id: this.newIssue.goal_id || null,
                        title: this.newIssue.title,
                        description: this.newIssue.description,
                        assigned_to: this.newIssue.assigned_to || null,
                        priority: parseInt(this.newIssue.priority, 10) || 0,
                        labels: (this.newIssue.labels || '')
                            .split(',')
                            .map((label) => label.trim())
                            .filter(Boolean),
                    });
                    this.newIssue = {
                        goal_id: '',
                        title: '',
                        description: '',
                        assigned_to: '',
                        priority: 2,
                        labels: '',
                    };
                    this.showIssueForm = false;
                    await this.loadCompanyData();
                } catch (e) {
                    this.loadError = e.message || 'Failed to create issue';
                }
            },

            async updateGoalStatus(goalId, status) {
                try {
                    await ClawReformAPI.put('/api/company/goals/' + goalId, { status: status });
                    await this.loadCompanyData();
                } catch (e) {
                    this.loadError = e.message || 'Failed to update goal';
                }
            },

            async deleteGoal(goalId) {
                try {
                    await ClawReformAPI.delete('/api/company/goals/' + goalId);
                    await this.loadCompanyData();
                } catch (e) {
                    this.loadError = e.message || 'Failed to delete goal';
                }
            },

            async updateIssueStatus(issueId, status) {
                try {
                    await ClawReformAPI.put('/api/company/issues/' + issueId, { status: status });
                    await this.loadCompanyData();
                } catch (e) {
                    this.loadError = e.message || 'Failed to update issue';
                }
            },

            async deleteIssue(issueId) {
                try {
                    await ClawReformAPI.delete('/api/company/issues/' + issueId);
                    await this.loadCompanyData();
                } catch (e) {
                    this.loadError = e.message || 'Failed to delete issue';
                }
            },

            statusColor(status) {
                const colors = {
                    pending: 'color: #888',
                    active: 'color: #4fc3f7',
                    completed: 'color: #66bb6a',
                    failed: 'color: #ef5350',
                };
                return colors[status] || 'color: #888';
            },

            budgetPercent() {
                if (!this.budget.allocated) return 0;
                return Math.round((this.budget.spent / this.budget.allocated) * 100);
            },

            formatCurrency(val) {
                return '$' + (val || 0).toFixed(2);
            },

            goalTitle(goalId) {
                if (!goalId) return 'Unlinked';
                const match = this.goals.find((goal) => goal.id === goalId);
                return match ? match.title : 'Unlinked';
            }
        };
    });
});
