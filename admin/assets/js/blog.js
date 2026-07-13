/* admin/assets/js/blog.js */
NexoraAdmin.onComponentsReady(async () => {
    console.log('blog.js initialized');

    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    const html = `
        <section class="module-grid grid-3 gap-20">
            <article class="stat-card card shadow-md">
                <h5>Total Posts</h5>
                <h2 id="blogTotal">0</h2>
                <small>Published and draft articles.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Published</h5>
                <h2 id="blogPublished">0</h2>
                <small>Content live on the website.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Drafts</h5>
                <h2 id="blogDrafts">0</h2>
                <small>Work in progress posts.</small>
            </article>
        </section>

        <section class="card shadow-md">
            <div class="page-header">
                <div>
                    <h2>Blog Content Studio</h2>
                    <p class="page-description">Create, publish and manage your Nexora blog posts.</p>
                </div>
            </div>
            <div class="grid grid-2 gap-20">
                <div class="card shadow-sm">
                    <h3>New / Edit Post</h3>
                    <form id="postForm" class="grid grid-1 gap-16">
                        <input type="hidden" id="postId" value="" />
                        <div class="form-group">
                            <label>Title</label>
                            <input id="postTitle" type="text" class="input-field" required />
                        </div>
                        <div class="form-group">
                            <label>Category</label>
                            <input id="postCategory" type="text" class="input-field" placeholder="e.g. Interior Design" />
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <input id="postTags" type="text" class="input-field" placeholder="comma separated" />
                        </div>
                        <div class="form-group">
                            <label>Featured Image URL</label>
                            <input id="postImage" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Excerpt</label>
                            <textarea id="postExcerpt" rows="3" class="input-field"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Content</label>
                            <div class="rich-editor-toolbar d-flex gap-8">
                                <button type="button" data-command="bold" class="btn btn-secondary">B</button>
                                <button type="button" data-command="italic" class="btn btn-secondary">I</button>
                                <button type="button" data-command="insertUnorderedList" class="btn btn-secondary">• List</button>
                            </div>
                            <div id="postContent" class="rich-editor" contenteditable="true"></div>
                        </div>
                        <div class="form-group d-flex gap-10 wrap">
                            <label class="align-center"><input id="postStatus" type="checkbox" /> Publish now</label>
                        </div>
                        <div class="d-flex justify-between gap-10 wrap">
                            <button type="button" id="resetPost" class="btn btn-secondary">Reset</button>
                            <button type="submit" class="btn btn-primary">Save Post</button>
                        </div>
                    </form>
                </div>
                <div class="card shadow-sm">
                    <h3>Post Library</h3>
                    <div class="module-actions d-flex gap-10 wrap">
                        <input id="blogSearch" type="search" class="input-field" placeholder="Search posts" />
                        <select id="blogFilter" class="input-field">
                            <option value="All">All</option>
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                        </select>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table" id="blogTable">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Author</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="blogTableBody"><tr><td colspan="6">Loading posts...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
        <style>
            .form-group{display:flex;flex-direction:column;gap:8px;}
            .input-field{width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:#fff;}
            .rich-editor{min-height:180px;padding:14px;border:1px solid var(--border);border-radius:12px;background:#fff;overflow:auto;}
            .rich-editor-toolbar button{min-width:50px;}
            .status-pill{padding:6px 10px;border-radius:999px;font-size:.82rem;font-weight:700;display:inline-block;}
            .status-published{background:rgba(34,197,94,.12);color:#166534;}
            .status-draft{background:rgba(156,163,175,.12);color:#374151;}
            .data-table th, .data-table td{padding:12px 14px;border-bottom:1px solid rgba(0,0,0,.08);}
            .data-table th{background:rgba(200,148,69,.08);font-weight:700;}
            .data-table tr:hover{background:rgba(200,148,69,.05);}
            .btn{border-radius:10px;padding:10px 14px;}
            .btn-primary{background:var(--primary);color:#fff;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
            @media(max-width:992px){.grid-2{grid-template-columns:1fr;}}
        </style>
    `;

    content.insertAdjacentHTML('beforeend', html);

    const postForm = document.getElementById('postForm');
    const postId = document.getElementById('postId');
    const postTitle = document.getElementById('postTitle');
    const postCategory = document.getElementById('postCategory');
    const postTags = document.getElementById('postTags');
    const postImage = document.getElementById('postImage');
    const postExcerpt = document.getElementById('postExcerpt');
    const postContent = document.getElementById('postContent');
    const postStatus = document.getElementById('postStatus');
    const resetPost = document.getElementById('resetPost');
    const blogSearch = document.getElementById('blogSearch');
    const blogFilter = document.getElementById('blogFilter');
    const blogTableBody = document.getElementById('blogTableBody');
    const blogTotal = document.getElementById('blogTotal');
    const blogPublished = document.getElementById('blogPublished');
    const blogDrafts = document.getElementById('blogDrafts');
    const editorButtons = document.querySelectorAll('[data-command]');

    let posts = [];

    function getFilteredPosts(){
        const query = blogSearch.value.trim().toLowerCase();
        return posts.filter(item => {
            const statusMatches = blogFilter.value === 'All' || item.status === blogFilter.value;
            const queryMatches = !query || item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query) || item.tags.join(',').toLowerCase().includes(query);
            return statusMatches && queryMatches;
        });
    }

    function renderStats(){
        blogTotal.textContent = posts.length;
        blogPublished.textContent = posts.filter(p => p.status === 'Published').length;
        blogDrafts.textContent = posts.filter(p => p.status === 'Draft').length;
    }

    function renderPosts(){
        const filtered = getFilteredPosts();
        blogTableBody.innerHTML = filtered.length ? filtered.map(item => `
            <tr>
                <td>${item.title}</td>
                <td>${item.category}</td>
                <td><span class="status-pill status-${item.status.toLowerCase()}">${item.status}</span></td>
                <td>${item.author}</td>
                <td>${NexoraAdmin.formatDateTime(item.createdAt)}</td>
                <td class="d-flex gap-8 wrap">
                    <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                    <button class="btn btn-secondary" data-action="delete" data-id="${item.id}">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6">No posts available.</td></tr>';
        attachPostActions();
    }

    function attachPostActions(){
        blogTableBody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                const post = posts.find(item => item.id === id);
                if(!post) return;
                if(action === 'edit'){
                    postId.value = post.id;
                    postTitle.value = post.title;
                    postCategory.value = post.category;
                    postTags.value = (post.tags || []).join(', ');
                    postImage.value = post.featuredImage || '';
                    postExcerpt.value = post.excerpt || '';
                    postContent.innerHTML = post.content || '';
                    postStatus.checked = post.status === 'Published';
                    NexoraAdmin.showToast('Loaded post into editor.');
                }
                if(action === 'delete'){
                    if(!confirm('Delete this blog post?')) return;
                    try{
                        await NexoraAdmin.apiDelete(`/api/admin/blog/${encodeURIComponent(id)}`);
                        posts = posts.filter(item => item.id !== id);
                        renderStats();
                        renderPosts();
                        NexoraAdmin.showToast('Blog post deleted.');
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to delete post.', 'error');
                    }
                }
            });
        });
    }

    editorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const command = button.dataset.command;
            document.execCommand(command, false, null);
            postContent.focus();
        });
    });

    async function loadPosts(){
        try{
            const res = await NexoraAdmin.apiGet('/api/admin/blog');
            posts = res.items || [];
            renderStats();
            renderPosts();
        }catch(err){
            blogTableBody.innerHTML = '<tr><td colspan="6">Unable to load posts.</td></tr>';
            NexoraAdmin.showToast(err.message || 'Unable to load blog posts.', 'error');
        }
    }

    async function savePost(){
        const data = {
            title: postTitle.value.trim(),
            category: postCategory.value.trim(),
            tags: postTags.value.split(',').map(tag => tag.trim()).filter(Boolean),
            featuredImage: postImage.value.trim(),
            excerpt: postExcerpt.value.trim(),
            content: postContent.innerHTML.trim(),
            author: 'Admin',
            status: postStatus.checked ? 'Published' : 'Draft',
            createdAt: new Date().toISOString()
        };
        if(!data.title){ NexoraAdmin.showToast('Post title is required.', 'error'); return; }
        const id = postId.value.trim();
        try{
            if(id){
                const updated = await NexoraAdmin.apiPut(`/api/admin/blog/${encodeURIComponent(id)}`, data);
                posts = posts.map(item => item.id === id ? updated.item : item);
                NexoraAdmin.showToast('Post updated.');
            } else {
                const created = await NexoraAdmin.apiPost('/api/admin/blog', data);
                posts.unshift(created.item);
                NexoraAdmin.showToast('Post created.');
            }
            renderStats();
            renderPosts();
            resetEditor();
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to save post.', 'error');
        }
    }

    function resetEditor(){
        postId.value = '';
        postTitle.value = '';
        postCategory.value = '';
        postTags.value = '';
        postImage.value = '';
        postExcerpt.value = '';
        postContent.innerHTML = '';
        postStatus.checked = false;
    }

    postForm.addEventListener('submit', async (e) => { e.preventDefault(); await savePost(); });
    resetPost.addEventListener('click', (e) => { e.preventDefault(); resetEditor(); });
    blogSearch.addEventListener('input', renderPosts);
    blogFilter.addEventListener('change', renderPosts);

    await loadPosts();
});
