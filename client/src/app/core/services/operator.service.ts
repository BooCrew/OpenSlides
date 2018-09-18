import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { OpenSlidesComponent } from 'app/openslides.component';
import { Group } from 'app/shared/models/users/group';
import { User } from '../../shared/models/users/user';
import { environment } from 'environments/environment';
import { DataStoreService } from './data-store.service';

/**
 * Permissions on the client are just strings. This makes clear, that
 * permissions instead of arbitrary strings should be given.
 */
export type Permission = string;

/**
 * Response format of the WHoAMI request.
 */
interface WhoAmIResponse {
    user_id: number;
    guest_enabled: boolean;
    user: User;
}

/**
 * The operator represents the user who is using OpenSlides.
 *
 * Changes in operator can be observed, directives do so on order to show
 * or hide certain information.
 *
 * The operator is an {@link OpenSlidesComponent}.
 */
@Injectable({
    providedIn: 'root'
})
export class OperatorService extends OpenSlidesComponent {
    /**
     * The operator.
     */
    private _user: User;

    /**
     * Get the user that corresponds to operator.
     */
    public get user(): User {
        return this._user;
    }

    /**
     * Sets the current operator.
     *
     * The permissions are updated and the new user published.
     */
    public set user(user: User) {
        this._user = user;
        this.updatePermissions();
    }

    /**
     * Save, if quests are enabled.
     */
    public guestsEnabled: boolean;

    /**
     * The permissions of the operator. Updated via {@method updatePermissions}.
     */
    private permissions: Permission[] = [];

    /**
     * The subject that can be observed by other instances using observing functions.
     */
    private operatorSubject: BehaviorSubject<User> = new BehaviorSubject<User>(null);

    /**
     * @param http HttpClient
     */
    public constructor(private http: HttpClient, private DS: DataStoreService) {
        super();

        this.DS.changeObservable.subscribe(newModel => {
            if (this._user) {
                if (newModel instanceof Group) {
                    this.updatePermissions();
                }

                if (newModel instanceof User && this._user.id === newModel.id) {
                    this._user = newModel;
                    this.updatePermissions();
                }
            } else if (newModel instanceof Group && newModel.id === 1) {
                // Group 1 (default) for anonymous changed
                this.updatePermissions();
            }
        });
    }

    /**
     * Calls `/apps/users/whoami` to find out the real operator.
     */
    public whoAmI(): Observable<WhoAmIResponse> {
        return this.http.get<WhoAmIResponse>(environment.urlPrefix + '/users/whoami/').pipe(
            tap((response: WhoAmIResponse) => {
                if (response && response.user_id) {
                    this.user = new User(response.user);
                }
            }),
            catchError(this.handleError())
        ) as Observable<WhoAmIResponse>;
    }

    /**
     * Returns the operatorSubject as an observable.
     *
     * Services an components can use it to get informed when something changes in
     * the operator
     */
    public getObservable(): Observable<User> {
        return this.operatorSubject.asObservable();
    }

    /**
     * Checks, if the operator has at least one of the given permissions.
     * @param checkPerms The permissions to check, if at least one matches.
     */
    public hasPerms(...checkPerms: Permission[]): boolean {
        return checkPerms.some(permission => {
            return this.permissions.includes(permission);
        });
    }

    /**
     * Update the operators permissions and publish the operator afterwards.
     */
    private updatePermissions(): void {
        this.permissions = [];
        if (!this.user) {
            const defaultGroup = this.DS.get<Group>('users/group', 1);
            if (defaultGroup && defaultGroup.permissions instanceof Array) {
                this.permissions = defaultGroup.permissions;
            }
        } else {
            const permissionSet = new Set();
            this.DS.getMany(Group, this.user.groups_id).forEach(group => {
                group.permissions.forEach(permission => {
                    permissionSet.add(permission);
                });
            });
            this.permissions = Array.from(permissionSet.values());
        }
        // publish changes in the operator.
        this.operatorSubject.next(this.user);
    }
}
