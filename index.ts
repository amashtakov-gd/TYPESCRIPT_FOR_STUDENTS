type User = {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleted: boolean;
}

enum HttpMethod {
  GET = 'GET',
  POST = 'POST'
}

type HttpRequest = {
  method: HttpMethod;
  host: string;
  path: string;
  body?: User;
  params?: { [key: string] : string };
}

enum HttpStatus {
  OK = 200,
  INTERNAL_SERVER_ERROR = 500
}

type HttpResponse = {
  status: HttpStatus;
}

interface EventHandlers {
  next?: (request: HttpRequest) => HttpResponse
  error?: (error: Error) => HttpResponse
  complete?: () => void
}

class Observer {
  private handlers: EventHandlers;
  private isUnsubscribed: boolean = false;
  _unsubscribe?: UnsubscribeCallback;

  constructor(handlers: EventHandlers) {
    this.handlers = handlers;
  }

  next(value: HttpRequest) : void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: Error) : void {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() : void {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() : void {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

type UnsubscribeCallback = () => void;
type ObservableStrategy = (observer: Observer) => UnsubscribeCallback;

interface Subscription {
  unsubscribe() : void;
}

class Observable {
  _subscribe: ObservableStrategy;
  
  constructor(subscribe: ObservableStrategy) {
    this._subscribe = subscribe;
  }

  static from(values: HttpRequest[]) : Observable {
    return new Observable((observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(obs: EventHandlers) : Subscription {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return ({
      unsubscribe() {
        observer.unsubscribe();
      }
    });
  }
}

const userMock : User = {
  name: 'User Name', 
  age: 26, 
  roles: ['user', 'admin'],
  createdAt: new Date(),
  isDeleted: false
};

const requestMocks : HttpRequest[] = [
  {
    method: HttpMethod.POST,
    host: 'service.example',
    path: 'user',
    body: userMock
  },
  {
    method: HttpMethod.GET,
    host: 'service.example',
    path: 'user',
    params: { id: '3f5h67s4s' }
  }
];

const handleRequest = (request: HttpRequest) : HttpResponse => {
  // handling of request
  return { status: HttpStatus.OK};
};
const handleError = (error: Error) : HttpResponse => {
  // handling of error
  return {status: HttpStatus.INTERNAL_SERVER_ERROR};
};
const handleComplete = () : void => console.log('complete');

const requests$ = Observable.from(requestMocks);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete
});

subscription.unsubscribe();