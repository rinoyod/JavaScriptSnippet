// Mock Service Worker(msw)によるcreateApiテスト
// mswのセットアップとAPIモック

import { createApi, ApiError } from './createApi.js';
import { setupServer } from 'msw/node'; // mswのサーバーセットアップ関数をインポート
import { http, HttpResponse } from 'msw'; // mswのHTTPハンドラとレスポンスユーティリティをインポート	

// モックサーバーのハンドラ
const server = setupServer(
	http.get('https://example.com/posts', ({ request }) => {
		return HttpResponse.json([
			{ id: 1, title: 'mock post', body: 'mock body' },
		], { status: 200 });
	}),
	http.post('https://example.com/posts', async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json({ id: 2, ...body }, { status: 201 });
	}),
	http.get('https://example.com/404notfound', () => {
		return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
	}),
	// textレスポンス
	http.get('https://example.com/text', () => {
		return new Response('plain text response', {
			status: 200,
			headers: { 'Content-Type': 'text/plain' },
		});
	}),
	// jsonレスポンス
	http.get('https://example.com/json', () => {
		return HttpResponse.json({ message: 'json response' }, { status: 200 });
	}),
	// バイナリレスポンス（ArrayBuffer）
	http.get('https://example.com/binary', () => {
		const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
		return new Response(buffer, {
			status: 200,
			headers: { 'Content-Type': 'application/octet-stream' },
		});
	})
);

server.listen();

const api = createApi('https://example.com', {
	timeout: 3000,
	retry: 1,
});

async function runTests() {
	try {
		// GETテスト
		const posts = await api.get('/posts');
		const expectedPosts = [{ id: 1, title: 'mock post', body: 'mock body' }];
		console.log('GET /posts:', posts);
		console.log('一致:', JSON.stringify(posts) === JSON.stringify(expectedPosts));

		// POSTテスト
		const postBody = { title: 'foo', body: 'bar', userId: 1 };
		const newPost = await api.post('/posts', postBody);
		const expectedNewPost = { id: 2, ...postBody };
		console.log('POST /posts:', newPost);
		console.log('一致:', JSON.stringify(newPost) === JSON.stringify(expectedNewPost));

		// エラー・リトライテスト
		try {
			await api.get('/404notfound');
		} catch (e) {
			if (e instanceof ApiError) {
				const expectedError = { error: 'Not Found' };
				console.log('ApiError:', e.status, e.data);
				console.log('一致:', e.status === 404 && JSON.stringify(e.data) === JSON.stringify(expectedError));
			} else {
				console.log('Other error:', e);
			}
		}

		// textレスポンステスト
		const text = await api.get('/text', { responseType: 'text' });
		const expectedText = 'plain text response';
		console.log('GET /text:', text);
		console.log('一致:', text === expectedText);

		// jsonレスポンステスト
		const json = await api.get('/json', { responseType: 'json' });
		const expectedJson = { message: 'json response' };
		console.log('GET /json:', json);
		console.log('一致:', JSON.stringify(json) === JSON.stringify(expectedJson));


		// バイナリレスポンステスト（ダウンロードOFF）
		const binary = await api.get('/binary', { responseType: 'arrayBuffer', download: false });
		const expectedBinary = new Uint8Array([1, 2, 3, 4]);
		const actualBinary = new Uint8Array(binary);
		console.log('GET /binary:', actualBinary);
		const binaryMatch = actualBinary.length === expectedBinary.length && actualBinary.every((v, i) => v === expectedBinary[i]);
		console.log('一致:', binaryMatch);

	} catch (err) {
		console.error('テスト失敗:', err);
	} finally {
		server.close();
	}
}

runTests();
