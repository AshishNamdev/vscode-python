// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { Disposable, ProgressLocation, ProgressOptions } from 'vscode';
import { IApplicationShell } from '../../common/application/types';
import { traceVerbose } from '../../common/logger';
import { IDisposableRegistry } from '../../common/types';
import { createDeferred, Deferred } from '../../common/utils/async';
import { Interpreters } from '../../common/utils/localize';
import { IInterpreterLocatorProgressService, InterpreterLocatorProgressHandler } from '../contracts';

@injectable()
export class InterpreterLocatorProgressStatubarHandler implements InterpreterLocatorProgressHandler {
    private deferred: Deferred<void> | undefined;
    private isFirstTimeLoadingInterpreters = true;
    constructor(@inject(IApplicationShell) private readonly shell: IApplicationShell,
        @inject(IInterpreterLocatorProgressService) private readonly progressService: IInterpreterLocatorProgressService,
        @inject(IDisposableRegistry) private readonly disposables: Disposable[]) { }
    public register() {
        this.progressService.onRefreshing(() => this.showProgress(), this, this.disposables);
        this.progressService.onRefreshed(() => this.hideProgress(), this, this.disposables);
    }
    @traceVerbose('Display locator refreshing progress')
    private showProgress(): void {
        if (!this.deferred) {
            this.createProgress();
        }
    }
    @traceVerbose('Hide locator refreshing progress')
    private hideProgress(): void {
        if (this.deferred) {
            this.deferred.resolve();
            this.deferred = undefined;
        }
    }
    private createProgress() {
        const progressOptions: ProgressOptions = {
            location: ProgressLocation.Window,
            title: this.isFirstTimeLoadingInterpreters ? Interpreters.loading() : Interpreters.refreshing()
        };
        this.isFirstTimeLoadingInterpreters = false;
        this.shell.withProgress(progressOptions, () => {
            this.deferred = createDeferred();
            return this.deferred.promise;
        });
    }
}
