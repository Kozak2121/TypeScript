@Injectable()
export class AuthService {

  authAPI;
  usersAPI;
  user: User;
  loggedIn$: EventEmitter<User>;

  constructor(
    private router: Router
  ) {
    this.loggedIn$ = new EventEmitter<User>();
    this.authAPI = new CloudApi.AccessTokenApi();
    this.usersAPI = new CloudApi.UsersApi();
  }

  public getToken(): string {
    return localStorage.getItem('token');
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  login(user): Promise<boolean> {
    return this.authAPI.getOAuthToken('password', 'generic', { 'username': user.username, 'password': user.password })
    .then(res => {
      if (!res.hasOwnProperty('token') && !res.hasOwnProperty('refresh_token')) {
        return Promise.resolve(false);
      } else {
        localStorage.setItem('token', get(res, 'access_token'));
        localStorage.setItem('token_type', get(res, 'token_type'));
        localStorage.setItem('refresh_token', get(res, 'refresh_token'));
        return Promise.resolve(true);
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('refresh_token');
    this.user = null as User;
    this.loggedIn$.emit(this.user);
    this.router.navigate(['auth']);
  }

  getUser(): Promise<User> {
    return this.usersAPI.getUser('me')
      .then((user: User) => {
        this.user = user;
        this.loggedIn$.emit(user);
        return Promise.resolve(user);
      })
      .catch(err => {
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
      });
  }

  public forgotPassword(credentials): Promise<any> {
    return this.usersAPI.submitPasswordReset({ passwordReset: credentials });
  }

  public resetPassword({ id, secret, password }): Promise<any> {
    return this.usersAPI.passwordReset(id, { newPasswordRequest: { secret, password } });
  }
}