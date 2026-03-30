import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { CreateTaskComponent } from './create-task.component';

const TASK_STUB = (overrides: object = {}) => ({
  id: 'p1', title: 'Test', description: '', status: 'backlog' as const,
  order: 0, tagIds: [], createdAt: '', updatedAt: '', ...overrides,
});

describe('CreateTaskComponent', () => {
  let comp: CreateTaskComponent;
  let fixture: ComponentFixture<CreateTaskComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTaskComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTaskComponent);
    comp = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture.detectChanges(); // triggers ngOnInit → TagService.list()
    httpMock.expectOne(r => r.url.endsWith('/tags') && r.method === 'GET').flush([]);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  // ── Test 1: DOM ─────────────────────────────────────────────────────────────
  it('renders title input', () => {
    const input = fixture.nativeElement.querySelector(
      'input[placeholder="What is the core focus?"]',
    );
    expect(input).toBeTruthy();
  });

  // ── Tests 2-3: canSave computed ──────────────────────────────────────────────
  it('canSave is false when title is empty', () => {
    comp.title.set('');
    expect(comp.canSave()).toBeFalse();
  });

  it('canSave is true when title has a value', () => {
    comp.title.set('My Task');
    expect(comp.canSave()).toBeTrue();
  });

  // ── Tests 4-5: toggleTag ─────────────────────────────────────────────────────
  it('toggleTag adds a tag id to selectedTagIds', () => {
    comp.tags.set([{ id: 't1', name: 'Design', color: '#ff0000' }]);
    comp.toggleTag('t1');
    expect(comp.selectedTagIds()).toContain('t1');
  });

  it('toggleTag removes a tag id when already selected', () => {
    comp.tags.set([{ id: 't1', name: 'Design', color: '#ff0000' }]);
    comp.selectedTagIds.set(['t1']);
    comp.toggleTag('t1');
    expect(comp.selectedTagIds()).not.toContain('t1');
  });

  // ── Tests 6-8: subtask management ────────────────────────────────────────────
  it('addSubtask appends an empty draft', () => {
    comp.addSubtask();
    expect(comp.subtasks().length).toBe(1);
    expect(comp.subtasks()[0].title).toBe('');
  });

  it('removeSubtask filters out the item at the given index', () => {
    comp.subtasks.set([{ title: 'A' }, { title: 'B' }]);
    comp.removeSubtask(0);
    expect(comp.subtasks().length).toBe(1);
    expect(comp.subtasks()[0].title).toBe('B');
  });

  it('updateSubtask updates only the item at the given index', () => {
    comp.subtasks.set([{ title: 'A' }, { title: 'B' }]);
    comp.updateSubtask(1, 'Updated');
    expect(comp.subtasks()[0].title).toBe('A');
    expect(comp.subtasks()[1].title).toBe('Updated');
  });

  // ── Tests 9-13: save flow ────────────────────────────────────────────────────
  it('save POSTs to /tasks with the correct payload', fakeAsync(() => {
    comp.title.set('My Task');
    comp.save();

    const req = httpMock.expectOne(
      r => r.method === 'POST' && r.url.endsWith('/tasks') && !r.body['parentId'],
    );
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ title: 'My Task', status: 'backlog' }),
    );
    req.flush(TASK_STUB({ id: 'p1', title: 'My Task' }));
    tick();
  }));

  it('save skips subtasks with empty titles', fakeAsync(() => {
    comp.title.set('My Task');
    comp.subtasks.set([{ title: '' }, { title: 'Valid Step' }]);
    comp.save();

    const parentReq = httpMock.expectOne(
      r => r.url.endsWith('/tasks') && !r.body['parentId'],
    );
    parentReq.flush(TASK_STUB({ id: 'p1' }));
    tick();

    // Only one subtask POST — the empty title is skipped
    const subtaskReq = httpMock.expectOne(
      r => r.url.endsWith('/tasks') && r.body['parentId'] === 'p1',
    );
    expect(subtaskReq.request.body['title']).toBe('Valid Step');
    subtaskReq.flush(TASK_STUB({ id: 's1', title: 'Valid Step', parentId: 'p1' }));
    tick();
    // httpMock.verify() in afterEach confirms no extra POST was made
  }));

  it('save POSTs each subtask with the correct parentId', fakeAsync(() => {
    comp.title.set('My Task');
    comp.subtasks.set([{ title: 'Step 1' }, { title: 'Step 2' }]);
    comp.save();

    const parentReq = httpMock.expectOne(r => r.url.endsWith('/tasks') && !r.body['parentId']);
    parentReq.flush(TASK_STUB({ id: 'p1' }));
    tick();

    const s1 = httpMock.expectOne(
      r => r.url.endsWith('/tasks') && r.body['parentId'] === 'p1',
    );
    expect(s1.request.body['title']).toBe('Step 1');
    s1.flush(TASK_STUB({ id: 's1', title: 'Step 1', parentId: 'p1' }));
    tick();

    const s2 = httpMock.expectOne(
      r => r.url.endsWith('/tasks') && r.body['parentId'] === 'p1',
    );
    expect(s2.request.body['title']).toBe('Step 2');
    s2.flush(TASK_STUB({ id: 's2', title: 'Step 2', parentId: 'p1' }));
    tick();
  }));

  it('save navigates to /tasks/:id on success', fakeAsync(() => {
    comp.title.set('My Task');
    comp.save();

    httpMock.expectOne(r => r.url.endsWith('/tasks') && !r.body['parentId'])
      .flush(TASK_STUB({ id: 'p1' }));
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', 'p1']);
  }));

  it('save sets error signal and clears saving on HTTP failure', fakeAsync(() => {
    comp.title.set('My Task');
    comp.save();

    httpMock.expectOne(r => r.url.endsWith('/tasks') && !r.body['parentId'])
      .flush('Server Error', { status: 500, statusText: 'Server Error' });
    tick();

    expect(comp.error()).toBeTruthy();
    expect(comp.saving()).toBeFalse();
  }));

  // ── Tests 14-15: tag creation ─────────────────────────────────────────────────
  it('createTag POSTs to /tags', fakeAsync(() => {
    comp.newTagName.set('Design');
    comp.createTag();

    const req = httpMock.expectOne(r => r.method === 'POST' && r.url.endsWith('/tags'));
    expect(req.request.body).toEqual(jasmine.objectContaining({ name: 'Design' }));
    req.flush({ id: 't2', name: 'Design', color: '#6366f1' });
    tick();
  }));

  it('createTag auto-selects the newly created tag', fakeAsync(() => {
    comp.newTagName.set('Design');
    comp.createTag();

    httpMock.expectOne(r => r.url.endsWith('/tags'))
      .flush({ id: 't2', name: 'Design', color: '#6366f1' });
    tick();

    expect(comp.selectedTagIds()).toContain('t2');
  }));

  // ── Test 16: double-submit guard ──────────────────────────────────────────────
  it('canSave is false while saving is true', () => {
    comp.title.set('My Task');
    comp.saving.set(true);
    expect(comp.canSave()).toBeFalse();
  });
});
