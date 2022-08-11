// simulate getting products from DataBase
const products = [
  { name: 'Apples', country: 'Italy', cost: 3, instock: 10, img: 'img/apple.png' },
  { name: 'Oranges', country: 'Spain', cost: 4, instock: 3, img: 'img/orange.png' },
  { name: 'Beans', country: 'USA', cost: 2, instock: 5, img: 'img/beans.png' },
  { name: 'Cabbage', country: 'USA', cost: 1, instock: 8, img: 'img/cabbage.png' },
];
//=========Cart=============
const Cart = (props) => {
  const { Card, Accordion, Button } = ReactBootstrap;
  let data = props.location.data ? props.location.data : products;
  console.log(`data:${JSON.stringify(data)}`);

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  useEffect(() => {
    console.log('useEffect Called');
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: 'FETCH_INIT' });
      try {
        const result = await axios(url);
        console.log('FETCH FROM URl');
        if (!didCancel) {
          // result.data.data
          // first data is from axios object, second data is from strapi object
          dispatch({ type: 'FETCH_SUCCESS', payload: result.data.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: 'FETCH_FAILURE' });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = (props) => {
  const [items, setItems] = React.useState(products);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const { Card, Accordion, Button, Container, Row, Col, Image, Input } = ReactBootstrap;
  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState('http://localhost:1337/api/products');
  const [{ data, isLoading, isError }, doFetch] = useDataApi('http://localhost:1337/api/products', {
    data: [],
  });
  console.log(`Rendering Products ${JSON.stringify(data)}`);
  // Fetch Data
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item, i) => {
      if (item.name == name && item.instock > 0) {
        item.instock--;
        return item;
      }
    });
    
    console.log(`add to Cart ${JSON.stringify(item)}`);
    setCart([...cart, ...item]);
    //doFetch(query);
  };
  const deleteCartItem = (index) => {
    console.log('index : ', index);
    let newCart = cart.filter((item, i) => {
      if (index == i) {
        cart.splice(index, 1);
        item.instock++;
      }
    });
    setCart([...cart, ...newCart]);
  };
  
  let list = items.map((item, index) => {
    return (
      <li key={index} class="row">
        <div class="col-3">
        <Image src={item.img} width={70} roundedCircle></Image></div>
        
        <div class="col">
          <p>
            <strong>{item.name}:</strong> ${item.cost}<br/>
            <strong>In stock:</strong> {item.instock}
          </p> 
        </div>

        <div class="col">
        <button name={item.name} type="submit" onClick={addToCart} class="button">Add Item</button>
        </div>
      </li>
    );
  });
  let cartList = cart.map((item, index) => {
    return (
      <Accordion.Item key={1+index} eventKey={1 + index}>
        <Accordion.Header>
        <Image src={item.img} width={30} roundedCircle></Image> {item.name} 
        </Accordion.Header>
        <Accordion.Body onClick={() => deleteCartItem(index)}
          eventKey={1 + index}><div class="row">
            <div class="col">${item.cost} from {item.country} </div>
              <div class="col text-right">
                <span class="button">Remove Item</span>
              </div>
            </div>
        </Accordion.Body>
      </Accordion.Item>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };
  const restockProducts = (url) => {
    doFetch(url);
    let newItems = data.map((item) => {
      let { name, country, cost, instock } = item;
      return { name, country, cost, instock };
    });
    setItems([...items, ...newItems]);
  };

  return (
    <Container>
      <Row>
        <Col>
          <h2>Product List</h2>
          <ul style={{ listStyleType: 'none' }} class="pl-0">{list}</ul>
        </Col>
        <Col>
          <h2>Cart Contents</h2>
          <div><Accordion defaultActiveKey="0">{cartList}</Accordion></div>
        </Col>
        <Col>
          <h2>Check Out </h2>
          <p><strong>Total cost:</strong> $ {finalList().total}</p>
          <div class="mb-2"><strong>Final List:</strong><br></br> {finalList().total > 0 && finalList().final} </div>
          <button onClick={checkOut} class="button mb-2">CheckOut</button>
        </Col>
      </Row>
      <Row>
        <form class="col-4"
          onSubmit={(event) => {
            restockProducts(`http://localhost:1337/api/${query}`);
            console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <input class="form-control" type="text" value={query} onChange={(event) => setQuery(event.target.value)} /> 
          <button class="ml-2 button" type="submit">ReStock Products</button>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById('root'));
